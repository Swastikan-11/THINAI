import fs from "fs";

let code = fs.readFileSync("src/app/App.tsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Replace LanguageModal definition
const oldLangModal = `function LanguageModal({
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
              className={\`p-3 rounded-2xl border text-left flex flex-col gap-0.5 transition-all active:scale-95 \${
                currentLang === opt.name ? "border-green-600 bg-green-50 shadow-xs" : "border-gray-200 bg-white"
              }\`}>
              <span className="font-bold text-sm text-gray-900">{opt.nativeName}</span>
              <span className="text-[10px] text-gray-500">{opt.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}`;

const newLangModal = `function LanguageModal({
  currentLang,
  onSelect,
  onClose,
  onOpenReportModal
}: {
  currentLang: AppLanguage;
  onSelect: (l: AppLanguage) => void;
  onClose: () => void;
  onOpenReportModal?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = SUPPORTED_LANGUAGES.filter(opt =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.script.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="lang-modal-title">
      <div className="w-full max-w-sm rounded-3xl p-5 bg-white shadow-2xl flex flex-col gap-3 max-h-[85vh]">
        <div className="flex justify-between items-center pb-1 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Globe size={18} color={P} />
            <h3 id="lang-modal-title" className="font-bold text-base text-gray-800">Select Advisory Language</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search language / மொழியைத் தேட..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[48vh] pr-1">
          {filtered.map(opt => (
            <button
              key={opt.code}
              onClick={() => { onSelect(opt.name); onClose(); }}
              className={\`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-98 \${
                currentLang === opt.name ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-500" : "border-gray-200 bg-white hover:bg-gray-50"
              }\`}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-gray-900">{opt.nativeName}</span>
                <span className="text-[10px] text-gray-500">{opt.name} · {opt.script}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {opt.rtl && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase">RTL</span>}
                {currentLang === opt.name && <Check size={16} className="text-emerald-600 shrink-0" />}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-6 text-xs text-gray-400">No matching language found</div>
          )}
        </div>

        {onOpenReportModal && (
          <button
            type="button"
            onClick={() => { onClose(); onOpenReportModal(); }}
            className="mt-1 pt-2.5 border-t border-gray-100 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <AlertCircle size={13} />
            <span>Report a translation issue</span>
          </button>
        )}
      </div>
    </div>
  );
}`;

if (!code.includes(oldLangModal)) {
  console.error("Could not find oldLangModal!");
  process.exit(1);
}
code = code.replace(oldLangModal, newLangModal);

// 2. Replace HomeScreen language button
const oldHomeBtn = `<button
              onClick={onToggleLanguage || onOpenLangModal}
              className="min-h-[44px] px-3.5 py-1.5 rounded-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold active:scale-95 border border-white/30 transition-all cursor-pointer shadow-xs"
              title="Instant Language Switch (English / தமிழ்)"
              aria-label="EN | தமிழ் - Toggle language"
            >
              <Globe size={14} className="text-white shrink-0" />
              <span className={lang === "English" ? "text-amber-300 font-black underline underline-offset-2" : "text-white/70"}>EN</span>
              <span className="text-white/40">|</span>
              <span className={lang === "Tamil" ? "text-amber-300 font-black underline underline-offset-2" : "text-white/70"}>தமிழ்</span>
            </button>`;

const newHomeBtn = `<button
              onClick={onOpenLangModal}
              className="min-h-[44px] px-3 py-1.5 rounded-full flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold active:scale-95 border border-white/30 transition-all cursor-pointer shadow-xs"
              title="Select advisory language"
              aria-label={\`Select language, currently \${lang}\`}
            >
              <Globe size={14} className="text-white shrink-0" />
              <span className="text-white font-medium">{getLanguageOption(lang).nativeName.split(' ')[0]}</span>
              <ChevronDown size={12} className="text-white/70 shrink-0" />
            </button>`;

if (!code.includes(oldHomeBtn)) {
  console.error("Could not find oldHomeBtn!");
  process.exit(1);
}
code = code.replace(oldHomeBtn, newHomeBtn);

// 3. Add Report Translation Error button to SettingsScreen
const oldSettingsLang = `        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Advisory Language / மொழி:</label>
          <select
            value={form.language}
            onChange={e => setForm(f => ({ ...f, language: e.target.value as AppLanguage }))}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.name}>{l.nativeName} ({l.name})</option>
            ))}
          </select>
        </div>`;

const newSettingsLang = `        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Advisory Language / மொழி:</label>
          <select
            value={form.language}
            onChange={e => setForm(f => ({ ...f, language: e.target.value as AppLanguage }))}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.name}>{l.nativeName} ({l.name})</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500 mt-1">Chemical remedy safety warnings apply to unreviewed languages.</p>
        </div>`;

if (!code.includes(oldSettingsLang)) {
  console.error("Could not find oldSettingsLang!");
  process.exit(1);
}
code = code.replace(oldSettingsLang, newSettingsLang);

// 4. In App main component, add showTransReportModal state and wire it up
const oldAppModals = `      {showLangModal && (
        <LanguageModal
          currentLang={user.language}
          onSelect={handleLanguageChange}
          onClose={() => setShowLangModal(false)}
        />
      )}`;

const newAppModals = `      {showLangModal && (
        <LanguageModal
          currentLang={user.language}
          onSelect={handleLanguageChange}
          onClose={() => setShowLangModal(false)}
          onOpenReportModal={() => setShowTransReportModal(true)}
        />
      )}

      {showTransReportModal && (
        <TranslationErrorReportModal
          isOpen={showTransReportModal}
          onClose={() => setShowTransReportModal(false)}
          screenKey={screen}
          currentLanguage={user.language}
          showToast={showToast}
        />
      )}`;

if (!code.includes(oldAppModals)) {
  console.error("Could not find oldAppModals!");
  process.exit(1);
}
code = code.replace(oldAppModals, newAppModals);

// Also add state declaration
const oldStateHook = `const [showLangModal, setShowLangModal] = useState(false);`;
const newStateHook = `const [showLangModal, setShowLangModal] = useState(false);
  const [showTransReportModal, setShowTransReportModal] = useState(false);`;

if (!code.includes(oldStateHook)) {
  console.error("Could not find oldStateHook!");
  process.exit(1);
}
code = code.replace(oldStateHook, newStateHook);

fs.writeFileSync("src/app/App.tsx", code, "utf8");
console.log("Successfully patched src/app/App.tsx!");
