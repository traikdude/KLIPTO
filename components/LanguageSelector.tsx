import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LANGUAGES, Language } from '../services/localization';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (code: string) => void;
  isDarkTheme: boolean;
  borderClass: string;
  cardBgClass: string;
  textClass: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  isDarkTheme,
  borderClass,
  cardBgClass,
  textClass
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Collapses/folds long list cleanly
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Quick select languages (4 prominent global languages)
  const quickLanguages = LANGUAGES.filter(l => ['en', 'es', 'zh', 'ar'].includes(l.code));
  
  // Remaining languages
  const otherLanguages = LANGUAGES.filter(l => !['en', 'es', 'zh', 'ar'].includes(l.code));

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Select Language / 🌍"
        id="language-selector-btn"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-500/10 transition-colors ${
          isOpen ? 'text-amber-500 bg-slate-500/10' : ''
        }`}
      >
        <span className="text-sm select-none" role="img" aria-label="flag">
          {selectedLang.flag}
        </span>
        <span className="text-[10px] uppercase font-black tracking-wider hidden sm:inline">
          {selectedLang.code}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border ${borderClass} ${cardBgClass} overflow-hidden z-50`}
          >
            {/* Header */}
            <div className={`px-4 py-3 border-b ${borderClass} flex items-center justify-between bg-slate-500/5`}>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🌍</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Localization
                </span>
              </div>
              <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {LANGUAGES.length} Langs
              </span>
            </div>

            {/* Content: scrollable container */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-3 no-scrollbar">
              
              {/* CURRENT SELECTION INDICATOR */}
              <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{selectedLang.flag}</span>
                  <div className="text-left">
                    <p className="text-[11px] font-extrabold text-amber-500 leading-tight">
                      {selectedLang.nativeLabel}
                    </p>
                    <p className="text-[9px] text-slate-500 leading-none">Active System Translation</p>
                  </div>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              </div>

              {/* QUICK CHANNELS */}
              <div>
                <h4 className="px-2 pb-1 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Quick Select
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {quickLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all text-xs ${
                        currentLanguage === lang.code
                          ? 'bg-amber-500 text-black font-black border-transparent shadow-md'
                          : 'bg-slate-500/5 hover:bg-slate-500/10 border-transparent text-slate-300'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.nativeLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MORE LANGUAGES WITH FOLD/COLLAPSE CAPABILITY FOR DASHBOARD SCANNABILITY */}
              <div className="border-t pt-2" style={{ borderColor: isDarkTheme ? '#1e293b' : '#e2e8f0' }}>
                {!isExpanded ? (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-500/10 rounded-xl text-left transition-all text-[10px] font-black text-amber-500 uppercase tracking-wider"
                  >
                    <span>➕ Show All {LANGUAGES.length} Languages</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                        All Languages
                      </h4>
                      <button
                        onClick={() => setIsExpanded(false)}
                        className="text-[9px] font-black text-slate-500 hover:text-amber-500 uppercase tracking-wider transition-colors"
                      >
                        [ Collapse ]
                      </button>
                    </div>

                    {/* Scrollable grid list of remaining languages */}
                    <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1 no-scrollbar border border-slate-500/5 p-1 rounded-xl bg-slate-500/5">
                      {otherLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            onLanguageChange(lang.code);
                            setIsOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs ${
                            currentLanguage === lang.code
                              ? 'bg-amber-500 text-black font-black border-transparent shadow-md'
                              : 'hover:bg-slate-500/15 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span>{lang.flag}</span>
                            <div className="truncate">
                              <p className="font-bold leading-tight truncate">{lang.nativeLabel}</p>
                              <p className="text-[8px] text-slate-500 leading-none truncate">{lang.label}</p>
                            </div>
                          </div>
                          {currentLanguage === lang.code && (
                            <svg className="w-4 h-4 text-black flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
