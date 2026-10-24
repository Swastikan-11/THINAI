// THINAI Accessible, Searchable Language Dropdown (Step 2.1)
// Supports English + 22 Scheduled Languages of India
// Displays each language in its native script AND in English
// Keyboard accessible (Tab, Arrow keys, Enter, Escape) and screen-reader friendly

import React, { useState, useRef, useEffect } from "react";
import { Globe, Search, Check, ChevronDown, Sparkles } from "lucide-react";
import { 
  AppLanguage, 
  SUPPORTED_LANGUAGES, 
  LanguageOption, 
  getLanguageOption, 
  persistLanguage, 
  getLanguageReviewStatus 
} from "../../services/i18n";

interface LanguageDropdownProps {
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  className?: string;
  variant?: "header" | "modal" | "settings";
}

export function LanguageDropdown({
  currentLanguage,
  onLanguageChange,
  className = "",
  variant = "header"
}: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const currentOption = getLanguageOption(currentLanguage);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q) ||
      lang.script.toLowerCase().includes(q)
    );
  });

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredLanguages.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredLanguages.length - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredLanguages[highlightedIndex];
      if (selected) {
        handleSelect(selected.name);
      }
    }
  };

  const handleSelect = (lang: AppLanguage) => {
    persistLanguage(lang);
    onLanguageChange(lang);
    setIsOpen(false);
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll("li");
      const target = items[highlightedIndex];
      target?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        id="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="language-dropdown-listbox"
        aria-label="Select Application Language"
        className={`flex items-center gap-1.5 transition-all outline-none focus:ring-2 focus:ring-emerald-500 rounded-full ${
          variant === "header"
            ? "bg-white/20 hover:bg-white/30 text-white border border-white/30 px-3 py-1.5 text-xs font-bold shadow-xs"
            : variant === "settings"
            ? "w-full justify-between bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 px-3.5 py-2.5 rounded-xl text-sm font-semibold shadow-xs"
            : "w-full justify-between bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 px-4 py-3 rounded-2xl text-base font-bold shadow-sm"
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <Globe className={`shrink-0 ${variant === "header" ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-emerald-600"}`} />
          <span className="truncate">{currentOption.nativeName}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""} ${variant === "header" ? "text-white" : "text-slate-500"}`} />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-72 sm:w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-fade-in ${
            variant === "header" ? "right-0" : "left-0"
          }`}
          style={{ maxHeight: "380px" }}
        >
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search language / மொழி தேடுக..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Filter languages by name or script"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
              <span>22 Scheduled Languages + English</span>
              <span>Default: English</span>
            </div>
          </div>

          {/* Listbox */}
          <ul
            ref={listboxRef}
            id="language-dropdown-listbox"
            role="listbox"
            aria-label="Indian Languages"
            className="overflow-y-auto max-h-64 py-1 divide-y divide-slate-50"
          >
            {filteredLanguages.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-500">
                No matching language found.
              </li>
            ) : (
              filteredLanguages.map((opt, idx) => {
                const isSelected = opt.name === currentLanguage;
                const isHighlighted = idx === highlightedIndex;
                const review = getLanguageReviewStatus(opt.name);
                const isReviewed = review.status === "REVIEWED";

                return (
                  <li
                    key={opt.code}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.name)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 font-bold"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="text-sm font-semibold truncate leading-tight">
                        {opt.nativeName}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">{opt.script}</span>
                        {opt.rtl && (
                          <span className="text-[9px] px-1 rounded bg-slate-200 text-slate-700 font-mono">
                            RTL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        isReviewed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {isReviewed ? "Reviewed" : "Machine Draft"}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
