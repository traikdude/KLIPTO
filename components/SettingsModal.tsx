import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, Theme } from '../theme';
import { getTranslation } from '../services/localization';

interface SettingsModalProps {
  onClose: () => void;
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  theme: Theme;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onClearStorage: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  settings,
  updateSetting,
  theme,
  onExportBackup,
  onImportBackup,
  onClearStorage
}) => {
  // Navigation stack: null = main, 'server' | 'security' | 'storage' | 'sizing' | 'focus'
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Toggle helper
  const Toggle = ({ checked, onChange, id }: { checked: boolean; onChange: (val: boolean) => void; id?: string }) => (
    <button
      id={id}
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-orange-500' : 'bg-slate-700/60'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  // Panel Transition Variant
  const panelVariants = {
    initial: (custom: number) => ({
      x: custom > 0 ? 300 : -300,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeOut' }
    },
    exit: (custom: number) => ({
      x: custom > 0 ? -300 : 300,
      opacity: 0,
      transition: { duration: 0.2 }
    })
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className={`${theme.modalBg} border ${theme.border} rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-8 md:zoom-in duration-200 max-h-[90vh] flex flex-col z-10`}>
        
        {/* HEADER */}
        <div className={`px-6 py-4.5 border-b ${theme.border} flex items-center justify-between bg-slate-500/5`}>
          <div className="flex items-center gap-2.5">
            {activePanel ? (
              <button
                onClick={() => setActivePanel(null)}
                className="p-1 -ml-1 rounded-lg hover:bg-slate-500/10 text-orange-500 transition-all flex items-center gap-1 text-xs font-black uppercase tracking-wider"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <>
                <span className="text-lg">⚙️</span>
                <h2 className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>
                  {getTranslation(settings.language, 'settings')}
                </h2>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-500/10 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CONTAINER WITH TRANSITIONS */}
        <div className="p-5 overflow-y-auto min-h-[350px] relative flex-1 flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            {/* MAIN LIST VIEW */}
            {activePanel === null && (
              <motion.div
                key="main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                {/* 1. LOCAL SERVER ADDRESS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>Local Server Address</p>
                      <p className="text-[10px] text-slate-500">Sync endpoint for your note databases</p>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={settings.localServerAddress || ''}
                    onChange={(e) => updateSetting('localServerAddress', e.target.value)}
                    placeholder="http://localhost:3000/api"
                    className={`w-full px-4 py-2 text-xs font-semibold ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl focus:ring-1 focus:ring-orange-500 outline-none transition-all`}
                  />
                </div>

                {/* FLAT SETTINGS LIST */}
                <div className={`border ${theme.border} rounded-2xl divide-y ${theme.border} overflow-hidden bg-slate-500/5`}>
                  
                  {/* 2. BACKGROUND CLIPBOARD LISTENER */}
                  <div className="flex items-center justify-between p-4.5 hover:bg-slate-500/5 transition-colors">
                    <div className="text-left flex items-start gap-3">
                      <span className="text-lg mt-0.5 select-none">📋</span>
                      <div>
                        <p className={`text-xs font-bold ${theme.text}`}>Background Clipboard Listener</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Capture background text buffers automatically</p>
                      </div>
                    </div>
                    <Toggle
                      checked={!!settings.notesFromClipboardEnabled}
                      onChange={(val) => updateSetting('notesFromClipboardEnabled', val)}
                    />
                  </div>

                  {/* 3. UNIVERSAL CLIPBOARD */}
                  <div className="flex items-center justify-between p-4.5 hover:bg-slate-500/5 transition-colors">
                    <div className="text-left flex items-start gap-3">
                      <span className="text-lg mt-0.5 select-none">🌍</span>
                      <div>
                        <p className={`text-xs font-bold ${theme.text}`}>Universal Clipboard</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Synchronize buffers seamlessly across devices</p>
                      </div>
                    </div>
                    <Toggle
                      checked={!!settings.universalClipboardEnabled}
                      onChange={(val) => updateSetting('universalClipboardEnabled', val)}
                    />
                  </div>

                  {/* 4. AUTO-SAVE PERSISTENCE */}
                  <div className="flex items-center justify-between p-4.5 hover:bg-slate-500/5 transition-colors">
                    <div className="text-left flex items-start gap-3">
                      <span className="text-lg mt-0.5 select-none">💾</span>
                      <div>
                        <p className={`text-xs font-bold ${theme.text}`}>Immediate Auto-save</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Persist change-sets immediately into offline index</p>
                      </div>
                    </div>
                    <Toggle
                      checked={!!settings.syncNotesAutomatically}
                      onChange={(val) => updateSetting('syncNotesAutomatically', val)}
                    />
                  </div>

                  {/* 4b. TENTATIVE STEPS PROTECTION */}
                  <div className="flex items-center justify-between p-4.5 hover:bg-slate-500/5 transition-colors">
                    <div className="text-left flex items-start gap-3">
                      <span className="text-lg mt-0.5 select-none">🛡️</span>
                      <div>
                        <p className={`text-xs font-bold ${theme.text}`}>Tentative Steps Protection</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Require double-confirm for destructive operations</p>
                      </div>
                    </div>
                    <Toggle
                      checked={!!settings.tentativeStepsEnabled}
                      onChange={(val) => updateSetting('tentativeStepsEnabled', val)}
                    />
                  </div>

                  {/* 4c. CLEAR SELECTION AFTER ACTIONS */}
                  <div className="flex items-center justify-between p-4.5 hover:bg-slate-500/5 transition-colors">
                    <div className="text-left flex items-start gap-3">
                      <span className="text-lg mt-0.5 select-none">🧹</span>
                      <div>
                        <p className={`text-xs font-bold ${theme.text}`}>Auto-Clear Batch Selection</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Clear checklist items after move or recycle actions</p>
                      </div>
                    </div>
                    <Toggle
                      checked={!!settings.clearSelectionAfterAction}
                      onChange={(val) => updateSetting('clearSelectionAfterAction', val)}
                    />
                  </div>
                </div>

                {/* CHEVRON ROWS FOR NESTED PANELS */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Advanced Subsystems</h4>
                  
                  <div className={`border ${theme.border} rounded-2xl divide-y ${theme.border} overflow-hidden bg-slate-500/5`}>
                    
                    {/* 5. FOCUS TARGETING */}
                    <button
                      onClick={() => setActivePanel('focus')}
                      className="w-full flex items-center justify-between p-4.5 hover:bg-slate-500/10 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 select-none">🎯</span>
                        <div>
                          <p className={`text-xs font-bold ${theme.text}`}>Focus Targeting</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Configure where cursor placements target on launch</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded mr-1">
                          {settings.focusTargeting || 'editor'}
                        </span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>

                    {/* 6. FILE STORAGE / ARCHIVES */}
                    <button
                      onClick={() => setActivePanel('storage')}
                      className="w-full flex items-center justify-between p-4.5 hover:bg-slate-500/10 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 select-none">📦</span>
                        <div>
                          <p className={`text-xs font-bold ${theme.text}`}>File Storage & Archives</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Trigger backups, restore indexes, and manage cache</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>

                    {/* 7. SECURITY & PASSCODE */}
                    <button
                      onClick={() => setActivePanel('security')}
                      className="w-full flex items-center justify-between p-4.5 hover:bg-slate-500/10 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 select-none">🔑</span>
                        <div>
                          <p className={`text-xs font-bold ${theme.text}`}>Iron Shield & Passcode</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Configure secure locks and passcode shields</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded mr-1 ${
                          settings.passcodeLockEnabled ? 'text-green-500 bg-green-500/10' : 'text-slate-500 bg-slate-500/10'
                        }`}>
                          {settings.passcodeLockEnabled ? 'Shield Active' : 'Disabled'}
                        </span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>

                    {/* 8. TEXT WINDOW SIZING */}
                    <button
                      onClick={() => setActivePanel('sizing')}
                      className="w-full flex items-center justify-between p-4.5 hover:bg-slate-500/10 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 select-none">📐</span>
                        <div>
                          <p className={`text-xs font-bold ${theme.text}`}>Text Window Sizing</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Customize default editor limits and line layouts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded mr-1">
                          {settings.visibleTextLines || 3} Lns
                        </span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>

                    {/* 9. SCANNER RETURN TARGET */}
                    <button
                      onClick={() => setActivePanel('scanner')}
                      className="w-full flex items-center justify-between p-4.5 hover:bg-slate-500/10 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 select-none">📷</span>
                        <div>
                          <p className={`text-xs font-bold ${theme.text}`}>Scanner Return Destination</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Where scanner routes you after detecting barcodes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded mr-1">
                          {settings.returnToAfterScan || 'editor'}
                        </span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NESTED PANEL: FOCUS TARGETING */}
            {activePanel === 'focus' && (
              <motion.div
                key="focus"
                custom={1}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4 text-left"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-500/10">
                  <span className="text-lg">🎯</span>
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>Focus Targeting Setup</h3>
                    <p className="text-[9px] text-slate-500">Default cursor behavior when booting the workspace</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'editor', label: 'Primary Content Editor', desc: 'Focus the new note/snippet text field instantly' },
                    { id: 'search', label: 'Global Note Search Field', desc: 'Place cursor into search bar for fast lookup' },
                    { id: 'none', label: 'No Automatic Targeting', desc: 'Prevent keyboard/focus capture on startup' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateSetting('focusTargeting', option.id as any)}
                      className={`w-full p-4.5 rounded-2xl border text-left transition-all ${
                        (settings.focusTargeting || 'editor') === option.id
                          ? 'border-orange-500 bg-orange-500/10 shadow-lg'
                          : `border-${theme.border} bg-slate-500/5 hover:bg-slate-500/10`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-black uppercase tracking-wider ${
                          (settings.focusTargeting || 'editor') === option.id ? 'text-orange-500' : theme.text
                        }`}>
                          {option.label}
                        </p>
                        {(settings.focusTargeting || 'editor') === option.id && (
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 font-medium leading-relaxed">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* NESTED PANEL: FILE STORAGE & ARCHIVE */}
            {activePanel === 'storage' && (
              <motion.div
                key="storage"
                custom={1}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5 text-left"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-500/10">
                  <span className="text-lg">📦</span>
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>File Storage & Backups</h3>
                    <p className="text-[9px] text-slate-500">Backup and recover indexes securely</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <button
                    onClick={onExportBackup}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border border-transparent bg-slate-500/5 hover:bg-slate-500/10 transition-all group`}
                  >
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>Export Backup Archive</p>
                      <p className="text-[9px] text-slate-500 font-medium">Download entire database as a local JSON file</p>
                    </div>
                    <span className="text-sm group-hover:translate-x-0.5 transition-transform">📥</span>
                  </button>

                  <button
                    onClick={onImportBackup}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border border-transparent bg-slate-500/5 hover:bg-slate-500/10 transition-all group`}
                  >
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>Import Backup Archive</p>
                      <p className="text-[9px] text-slate-500 font-medium">Load and recover database from JSON archive files</p>
                    </div>
                    <span className="text-sm group-hover:translate-x-0.5 transition-transform">📤</span>
                  </button>

                  <button
                    onClick={onClearStorage}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all group`}
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-red-500">Clear Cached Storage</p>
                      <p className="text-[9px] text-slate-500 font-medium">Flush all database contents and reset defaults</p>
                    </div>
                    <span className="text-sm text-red-500">⚠️</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* NESTED PANEL: PASSCODE / SECURITY */}
            {activePanel === 'security' && (
              <motion.div
                key="security"
                custom={1}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5 text-left"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-500/10">
                  <span className="text-lg">🔑</span>
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>Iron Shield Locks</h3>
                    <p className="text-[9px] text-slate-500">Configure security settings and database shields</p>
                  </div>
                </div>

                <div className={`border ${theme.border} rounded-2xl divide-y ${theme.border} overflow-hidden bg-slate-500/5`}>
                  
                  {/* Enable Lock Toggle */}
                  <div className="flex items-center justify-between p-4 hover:bg-slate-500/5 transition-colors">
                    <div className="text-left">
                      <p className={`text-xs font-bold ${theme.text}`}>Passcode Shield Protection</p>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Enforce secure 4-digit lockout on app startup</p>
                    </div>
                    <Toggle
                      checked={!!settings.passcodeLockEnabled}
                      onChange={(val) => {
                        if (val && !settings.appPasscode) {
                          updateSetting('appPasscode', '1234'); // Default fallback
                        }
                        updateSetting('passcodeLockEnabled', val);
                      }}
                    />
                  </div>

                  {/* Fingerprint unlock */}
                  <div className="flex items-center justify-between p-4 hover:bg-slate-500/5 transition-colors">
                    <div className="text-left">
                      <p className={`text-xs font-bold ${theme.text}`}>Biometric Fingerprint Unlock</p>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Enable quick unlock via biometric sensors</p>
                    </div>
                    <Toggle
                      checked={!!settings.fingerprintUnlockEnabled}
                      onChange={(val) => updateSetting('fingerprintUnlockEnabled', val)}
                    />
                  </div>
                </div>

                {settings.passcodeLockEnabled && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">
                      Set 4-Digit Passcode
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      value={settings.appPasscode || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        updateSetting('appPasscode', val);
                      }}
                      placeholder="e.g. 1234"
                      className={`w-full px-4 py-2.5 text-center tracking-[1.5em] text-sm font-black ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl focus:ring-1 focus:ring-orange-500 outline-none transition-all`}
                    />
                    <p className="text-[9px] text-slate-500 text-center font-medium">
                      Ensure your passcode contains exactly 4 digits. Default is <span className="font-bold text-orange-500">1234</span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* NESTED PANEL: TEXT WINDOW SIZING */}
            {activePanel === 'sizing' && (
              <motion.div
                key="sizing"
                custom={1}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5 text-left"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-500/10">
                  <span className="text-lg">📐</span>
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>Text Window Sizing</h3>
                    <p className="text-[9px] text-slate-500">Configure visual heights and note display clamp-lines</p>
                  </div>
                </div>

                {/* Option: Clamp Lines Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Visible Clamped lines
                    </h4>
                    <span className="text-xs font-black text-orange-500 font-mono bg-orange-500/10 px-2 py-0.5 rounded-md">
                      {settings.visibleTextLines === 1 ? '1 Line (Ultra compact)' : `${settings.visibleTextLines || 3} Lines`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-[10px] font-black font-mono">1 LN</span>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      value={settings.visibleTextLines || 3}
                      onChange={(e) => updateSetting('visibleTextLines', parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-slate-500 text-[10px] font-black font-mono">12 LNS</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                    Note body height control. Low values create highly dense dashboards, while higher limits allow instant, readable contents.
                  </p>
                </div>

                {/* Display density presets */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Layout Density Presets</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'grid', label: 'Dashboard Bento Grid', lines: 3 },
                      { id: 'condensed', label: 'Compact Terminal Rows', lines: 1 },
                      { id: 'comfortable', label: 'Readable Article Cards', lines: 6 },
                      { id: 'default', label: 'Default Balanced List', lines: 4 }
                    ].map((preset) => {
                      const isSelected = settings.visibleTextLines === preset.lines;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            updateSetting('visibleTextLines', preset.lines);
                            updateSetting('listStyle', preset.id as any);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500/15 shadow-sm'
                              : `border-${theme.border} bg-slate-500/5 hover:bg-slate-500/10`
                          }`}
                        >
                          <p className={`text-[10px] font-black uppercase tracking-wider ${
                            isSelected ? 'text-orange-500' : theme.text
                          }`}>{preset.label}</p>
                          <p className="text-[8px] text-slate-500 font-medium mt-0.5">{preset.lines} line clamping</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* NESTED PANEL: SCANNER RETURN TARGET */}
            {activePanel === 'scanner' && (
              <motion.div
                key="scanner"
                custom={1}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4 text-left"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-500/10">
                  <span className="text-lg">📷</span>
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>Scanner Destination</h3>
                    <p className="text-[9px] text-slate-500">Choose destination after barcode scan completes</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'editor', label: 'Open Note Editor', desc: 'Directly open the newly created note/snippet for editing' },
                    { id: 'list', label: 'Return to Notes List', desc: 'Add note silently and return back to the general notes workspace' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateSetting('returnToAfterScan', option.id as any)}
                      className={`w-full p-4.5 rounded-2xl border text-left transition-all ${
                        (settings.returnToAfterScan || 'editor') === option.id
                          ? 'border-orange-500 bg-orange-500/10 shadow-lg'
                          : `border-${theme.border} bg-slate-500/5 hover:bg-slate-500/10`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-black uppercase tracking-wider ${
                          (settings.returnToAfterScan || 'editor') === option.id ? 'text-orange-500' : theme.text
                        }`}>
                          {option.label}
                        </p>
                        {(settings.returnToAfterScan || 'editor') === option.id && (
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 font-medium leading-relaxed">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER ACTION */}
        <div className={`p-4 bg-slate-950/80 border-t ${theme.border} flex items-center justify-between`}>
          <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
            Premium Local Daemon Active
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
