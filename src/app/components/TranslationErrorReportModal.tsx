// THINAI Translation Error Reporting Modal (Step 2.3)
// Allows farmers and field staff to report mistranslations, awkward phrasing, or script issues
// Saves record to local Dexie storage and Firestore /translation_reports with farmer consent.

import React, { useState } from "react";
import { X, AlertCircle, CheckCircle2, MessageSquare, Send, Globe, Lock } from "lucide-react";
import { AppLanguage, submitTranslationErrorReport, getLanguageOption } from "../../services/i18n";

interface TranslationErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenKey: string;
  currentLanguage: AppLanguage;
  defaultText?: string;
  showToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function TranslationErrorReportModal({
  isOpen,
  onClose,
  screenKey,
  currentLanguage,
  defaultText = "",
  showToast
}: TranslationErrorReportModalProps) {
  const [currentText, setCurrentText] = useState(defaultText);
  const [suggestedCorrection, setSuggestedCorrection] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedCorrection.trim()) {
      if (showToast) showToast("Please enter your suggested correct translation", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const ok = await submitTranslationErrorReport({
        screenKey,
        language: currentLanguage,
        currentText: currentText.trim(),
        suggestedCorrection: suggestedCorrection.trim(),
        notes: notes.trim() || undefined
      });

      if (ok) {
        setSubmitted(true);
        if (showToast) showToast("Translation correction report submitted for expert review!", "success");
      } else {
        if (showToast) showToast("Failed to submit translation report", "error");
      }
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const langOpt = getLanguageOption(currentLanguage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="trans-report-title">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 id="trans-report-title" className="text-base font-bold text-slate-900">
                Report a Translation Error
              </h2>
              <p className="text-xs text-slate-500">
                Language: <strong className="text-slate-800">{langOpt.nativeName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Correction Submitted!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Thank you for contributing. Your feedback has been queued for our native language agronomic review board and will appear in the officer dashboard.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Screen Context:</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px]">
                  {screenKey}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Phrasing (as seen on screen)
              </label>
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                rows={2}
                placeholder="e.g. Current displayed phrase..."
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Suggested Correct Phrasing in {langOpt.nativeName} *
              </label>
              <textarea
                value={suggestedCorrection}
                onChange={(e) => setSuggestedCorrection(e.target.value)}
                rows={3}
                required
                placeholder={`Type the correct translation in ${langOpt.name}...`}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agronomic Context / Reason (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Local dialect variation in Thanjavur..."
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Feedback is stored anonymously for language improvement under DPDP rules.</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !suggestedCorrection.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
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
