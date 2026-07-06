import React, { useState, useEffect } from 'react';
import { AppSettings, Theme, themes } from '../theme';
import { Clip, ClipType } from '../types';

interface RuneDetail {
  id: string;
  name: string;
  description: string;
  points?: string[];
  icon: string;
  color: string;
  type: 'settings' | 'themes' | 'swipes' | 'toggles' | 'links' | 'clipboard' | 'generic';
}

const runeDetails: Record<string, RuneDetail> = {
  '1': {
    id: '1',
    name: 'Astral Sync',
    description: 'The rune opens an opportunity:',
    points: ['automatically save all data in the cloud;', 'instantly access it on any other device;', 'save not only text notes, but also files of any format;'],
    icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
    color: 'text-sky-400',
    type: 'settings'
  },
  '12': {
    id: '12',
    name: 'Iron Shield',
    description: 'The rune allows you to protect access to the application with a password. When activated, access will be blocked after 2 minutes of inactivity. Important: if you forget your password, you will need to clear the application data.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    color: 'text-slate-400',
    type: 'toggles'
  },
  '3': {
    id: '3',
    name: 'Clipboard',
    description: 'The rune allows the app to monitor the clipboard and automatically create notes from text copied to the Clipboard. Once activated, the app will display a permanent status notification to keep track of buffers.',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    color: 'text-orange-400',
    type: 'clipboard'
  },
  '14': {
    id: '14',
    name: 'Swipe Power',
    description: 'With this rune, in the list of notes, you can set up actions with them, applied to swipe gestures.',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    color: 'text-yellow-500',
    type: 'swipes'
  },
  '15': {
    id: '15',
    name: 'Inspiring Support',
    description: 'Without your support and feedback, the product will not evolve in the right direction for users. Tap below to review or translate.',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color: 'text-rose-400',
    type: 'links'
  },
  '2': {
    id: '2',
    name: 'Chameleon Skin',
    description: 'By default, the application uses a color scheme that automatically changes between light and dark depending on the system settings. Choose your favorite static color preset below.',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    color: 'text-emerald-400',
    type: 'themes'
  },
  '4': {
    id: '4',
    name: 'The Oculus',
    description: 'Enable advanced link previews, media content indexing, OCR scanning, and visual Gemini analysis within your notes.',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    color: 'text-sky-500',
    type: 'generic'
  },
  '13': {
    id: '13',
    name: 'Keyboard Companion',
    description: 'Adds a persistent keyboard companion toolbar for quick access to your clipboard snippets across other mobile or desktop apps.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    color: 'text-orange-500',
    type: 'generic'
  }
};

const skills = [
  { id: '1', name: 'Astral Sync', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z', color: 'bg-sky-500/10 text-sky-400' },
  { id: '12', name: 'Iron Shield', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'bg-slate-500/10 text-slate-400' },
  { id: '2', name: 'Chameleon Skin', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', color: 'bg-emerald-500/10 text-emerald-400' },
  { id: '3', name: 'Clipboard', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', color: 'bg-orange-500/10 text-orange-400' },
  { id: '4', name: 'The Oculus', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'bg-sky-500/10 text-sky-500' },
  { id: '13', name: 'Keyboard Companion', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'bg-amber-500/10 text-orange-500' },
  { id: '5', name: 'Blowing Copy', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', color: 'bg-rose-500/10 text-rose-400' },
  { id: '14', name: 'Swipe Power', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'bg-yellow-500/10 text-yellow-500' },
  { id: '6', name: 'Point of No Return', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'bg-red-500/10 text-red-400' },
  { id: '7', name: 'Shifted Focus', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-purple-500/10 text-purple-400' },
  { id: '11', name: 'Tentative Steps', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-teal-500/10 text-teal-400' },
  { id: '8', name: 'Revive', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'bg-emerald-500/10 text-emerald-500' },
  { id: '16', name: 'Time Machine', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-indigo-500/10 text-indigo-400' },
  { id: '15', name: 'Inspiring Support', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', color: 'bg-rose-500/10 text-rose-400' }
];

interface SkillRunesProps {
  onBack: () => void;
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  theme: Theme;
  clips: Clip[];
  setClips: React.Dispatch<React.SetStateAction<Clip[]>>;
}

const SkillRunes: React.FC<SkillRunesProps> = ({ onBack, settings, updateSetting, theme, clips, setClips }) => {
  const [selectedRuneId, setSelectedRuneId] = useState<string | null>(() => {
    return localStorage.getItem('qlipto_selected_rune_id') || null;
  });

  const [isWideScreen, setIsWideScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectRune = (id: string | null) => {
    setSelectedRuneId(id);
    if (id) {
      localStorage.setItem('qlipto_selected_rune_id', id);
    } else {
      localStorage.removeItem('qlipto_selected_rune_id');
    }
  };

  const [isGridMode, setIsGridMode] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClipboardHistoryOpen, setIsClipboardHistoryOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Passcode set states
  const [passcodeStage, setPasscodeStage] = useState<'none' | 'enter' | 'confirm' | 'input-current'>('none');
  const [passcodeDigits, setPasscodeDigits] = useState<string>('');
  const [tempPasscode, setTempPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState(false);

  const detail = selectedRuneId ? runeDetails[selectedRuneId] : null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText('B5ip9cldT1cxJ75RbZ29kURNpMi1');
    setCopiedId(true);
    triggerToast('User ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const Toggle = ({ active, onChange }: { active: boolean; onChange?: () => void }) => (
    <div 
      onClick={onChange}
      className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors cursor-pointer ${
        active ? theme.accentBg : 'bg-slate-700/60'
      }`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform transform ${
        active ? 'translate-x-5' : 'translate-x-0'
      }`}></div>
    </div>
  );

  const startPasscodeSetup = () => {
    setPasscodeStage('enter');
    setPasscodeDigits('');
    setTempPasscode('');
    setPasscodeError(false);
  };

  const startPasscodeRemoval = () => {
    setPasscodeStage('input-current');
    setPasscodeDigits('');
    setPasscodeError(false);
  };

  const handleNumpadClick = (num: string) => {
    if (passcodeDigits.length >= 4) return;
    const nextDigits = passcodeDigits + num;
    setPasscodeDigits(nextDigits);

    if (nextDigits.length === 4) {
      setTimeout(() => {
        if (passcodeStage === 'enter') {
          setTempPasscode(nextDigits);
          setPasscodeDigits('');
          setPasscodeStage('confirm');
        } else if (passcodeStage === 'confirm') {
          if (nextDigits === tempPasscode) {
            updateSetting('appPasscode', nextDigits);
            updateSetting('passcodeLockEnabled', true);
            setPasscodeStage('none');
            triggerToast('Passcode Lock enabled successfully!');
          } else {
            setPasscodeError(true);
            setPasscodeDigits('');
            setTimeout(() => setPasscodeError(false), 800);
          }
        } else if (passcodeStage === 'input-current') {
          if (nextDigits === settings.appPasscode) {
            updateSetting('appPasscode', '');
            updateSetting('passcodeLockEnabled', false);
            setPasscodeStage('none');
            triggerToast('Passcode Lock disabled.');
          } else {
            setPasscodeError(true);
            setPasscodeDigits('');
            setTimeout(() => setPasscodeError(false), 800);
          }
        }
      }, 250);
    }
  };

  const handleNumpadBackspace = () => {
    setPasscodeDigits(prev => prev.slice(0, -1));
  };

  const mockClipboardItems = [
    "from fastapi import FastAPI\napp = FastAPI()\n\n@app.get('/')\ndef index():\n    return {'hello': 'world'}",
    "https://github.com/google/generative-ai-js",
    "🎨 Elegant displays paired with 'Fira Code' for technical snippets.",
    "B5ip9cldT1cxJ75RbZ29kURNpMi1"
  ];

  const handleImportClipboardHistory = (text: string) => {
    const newClip: Clip = {
      id: 'clip-' + Date.now(),
      title: text.split('\n')[0].substring(0, 30) + (text.length > 30 ? '...' : ''),
      content: text,
      type: text.startsWith('from') || text.includes('const') ? ClipType.CODE : ClipType.TEXT,
      timestamp: Date.now(),
      tags: ['clipboard'],
      isFavorite: false
    };
    setClips(prev => [newClip, ...prev]);
    setIsClipboardHistoryOpen(false);
    triggerToast('Created a new note from Clipboard history!');
  };

  return (
    <div className={`flex-1 flex flex-col ${theme.bg} ${theme.text} animate-in fade-in duration-300 overflow-hidden h-full relative`}>
      {/* Header bar */}
      <div className={`h-16 border-b ${theme.border} flex items-center justify-between px-6 ${theme.sidebarBg} flex-shrink-0`}>
        <div className="flex items-center gap-4">
          <button 
            id="btn-skillrunes-back"
            onClick={() => {
              if (isWideScreen) {
                onBack();
              } else {
                if (selectedRuneId) {
                  handleSelectRune(null);
                } else {
                  onBack();
                }
              }
            }} 
            className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 transition-colors font-black uppercase text-[11px] tracking-wider"
            title={(!isWideScreen && selectedRuneId) ? "Back to Runes Grid" : "Back to Notes"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{(!isWideScreen && selectedRuneId) ? "Back to Library" : "Back to Notes"}</span>
          </button>
          <h2 className="text-lg font-bold uppercase tracking-tight">
            {isWideScreen ? 'Skill Runes' : (detail ? detail.name : 'Skill Runes')}
          </h2>
        </div>

        {/* Global Toolbar */}
        {!selectedRuneId && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-200/10 transition-all"
              title="Help"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Language Selector Indicator */}
            <button 
              onClick={() => {
                const nextLang = settings.language === 'en' ? 'es' : settings.language === 'es' ? 'de' : 'en';
                updateSetting('language', nextLang);
                triggerToast(`Language switched to ${nextLang.toUpperCase()}`);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-700 hover:border-slate-500 transition-all"
            >
              <span>🇺🇸</span>
              <span className="uppercase text-[10px] tracking-wider">{settings.language}</span>
            </button>

            {/* Bento/Grid toggle */}
            <button 
              onClick={() => setIsGridMode(!isGridMode)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-200/10 transition-all"
            >
              {isGridMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Body with Split Pane Layout support */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Left Panel: Cards Grid/List */}
        <div className={`h-full overflow-y-auto transition-all duration-300 ${
          selectedRuneId 
            ? 'hidden md:block md:w-[45%] lg:w-[40%] xl:w-[35%] shrink-0 border-r border-slate-800/40' 
            : 'w-full flex-1'
        }`}>
          <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-black tracking-tight">Active Runes Library</h1>
              <p className="text-xs opacity-60">Collect and configure specialized system abilities below.</p>
            </div>

            {isGridMode ? (
              <div className={`grid gap-4 ${
                selectedRuneId 
                  ? 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
              }`}>
                {skills.map((skill) => {
                  const runeDetail = runeDetails[skill.id];
                  const isActive = skill.id === selectedRuneId;
                  return (
                    <div 
                      key={skill.id} 
                      onClick={() => handleSelectRune(skill.id)}
                      className={`group rounded-2xl p-4 border transition-all cursor-pointer flex flex-col items-center text-center gap-3 bg-white shadow-sm hover:shadow-md ${
                        isActive 
                          ? 'ring-2 ring-amber-500 border-transparent scale-[0.98]' 
                          : 'border-slate-100 hover:border-slate-200 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {/* Centered circular icon backdrop with minimalist line icon */}
                      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200/40 group-hover:scale-105 transition-transform shrink-0 shadow-inner">
                        <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={skill.icon} />
                        </svg>
                      </div>
                      <div className="min-w-0 w-full">
                        {/* Black title text */}
                        <h3 className="font-bold text-xs leading-tight text-slate-900 truncate">{skill.name}</h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">
                          {runeDetail ? runeDetail.type : 'Passive'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List Mode with matching elevated style */
              <div className="space-y-3">
                {skills.map((skill) => {
                  const isActive = skill.id === selectedRuneId;
                  return (
                    <div 
                      key={skill.id} 
                      onClick={() => handleSelectRune(skill.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between bg-white shadow-sm hover:shadow-md ${
                        isActive 
                          ? 'ring-2 ring-amber-500 border-transparent scale-[0.99]' 
                          : 'border-slate-100 hover:border-slate-200 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200/40 shrink-0 shadow-inner">
                          <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={skill.icon} />
                          </svg>
                        </div>
                        <div className="min-w-0 text-left">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{skill.name}</h3>
                          <p className="text-xs text-slate-500 truncate">{runeDetails[skill.id]?.description || 'Enhance Clipto productivity instantly.'}</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Detail view */}
        <div className={`h-full overflow-y-auto flex-1 transition-all duration-300 ${
          selectedRuneId ? 'w-full' : 'hidden'
        }`}>
          {selectedRuneId && (
            <div className="max-w-xl mx-auto p-5 md:p-8 animate-in slide-in-from-bottom-4 duration-300">
              {/* Header icon and title */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white border border-slate-200/40 shadow-md mb-3">
                  <svg className="w-10 h-10 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={detail?.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-100">{detail?.name}</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mt-1">Rune Configurator</p>
              </div>

            {/* Config Card */}
            <div className={`${theme.cardBg} p-6 rounded-2xl border ${theme.border} shadow-2xl space-y-6`}>
              {/* Header explanation banner */}
              <div className="p-4 bg-slate-500/5 rounded-xl border border-slate-700/20">
                <p className="text-xs opacity-80 leading-relaxed text-center font-medium">
                  {detail?.description}
                </p>
                {detail?.points && (
                  <div className="mt-3 space-y-2 pl-2">
                    {detail.points.map((p, i) => (
                      <div key={i} className="flex gap-2.5 text-xs opacity-80">
                        <span className={`${detail.color || 'text-[#fbc02d]'} font-bold`}>•</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ASTRAL SYNC SCREEN (SETTINGS) */}
              {selectedRuneId === '1' && (
                <div className="space-y-4">
                  {/* Astronaut card */}
                  <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-none">Encrypted Cipher (Syncing)</p>
                        <p className="text-[10px] text-indigo-400/80 font-bold mt-1">Status: Active Cloud Network • ID: 300</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast('Successfully updated encryption cipher indexes.')}
                      className={`px-3 py-1.5 ${theme.accentBg} ${theme.accentHover} text-black text-[9px] font-bold rounded-lg uppercase tracking-wider transition-all`}
                    >
                      Update
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800/40">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h4 className="text-xs font-bold">Sync notes automatically</h4>
                        <p className="text-[10px] opacity-50 mt-0.5">Saves all changes to the cloud immediately</p>
                      </div>
                      <Toggle 
                        active={settings.syncNotesAutomatically} 
                        onChange={() => updateSetting('syncNotesAutomatically', !settings.syncNotesAutomatically)} 
                      />
                    </div>

                    <div 
                      onClick={() => {
                        setClips([]);
                        localStorage.removeItem('qlipto_clips');
                        triggerToast('Signed out. Resetting local workspace.');
                      }}
                      className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-500/5 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-rose-400">Sign out</h4>
                        <p className="text-[10px] opacity-50 mt-0.5">Logs out of cloud storage and purges cache</p>
                      </div>
                      <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                  </div>

                  {/* System Download Blocks */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button 
                      onClick={() => triggerToast('Downloading Clipto Client for macOS/Windows/Linux...')}
                      className="py-3 px-2 border border-slate-700/60 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center hover:bg-slate-500/5 transition-all"
                    >
                      Download App
                    </button>
                    <button 
                      onClick={() => triggerToast('Web Link copied! Open in your mobile/desktop browser.')}
                      className="py-3 px-2 border border-slate-700/60 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center hover:bg-slate-500/5 transition-all"
                    >
                      Clipto Web
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-800/40 flex flex-col gap-2 text-center">
                    <button 
                      onClick={() => triggerToast('Database index rebuild triggered successfully.')}
                      className="text-[10px] text-amber-500 hover:underline font-bold"
                    >
                      Rebuild data index
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] opacity-70">
                      <span>My User ID:</span>
                      <code className="font-mono bg-slate-800/40 px-2 py-0.5 rounded text-amber-400">
                        B5ip9cldT...
                      </code>
                      <button onClick={handleCopyId} className="hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a3 3 0 013-3h2a3 3 0 013 3m0 0a2 2 0 012 2v3m-6 4h10m-5-5v10" />
                        </svg>
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        if (confirm('Are you absolutely sure you want to delete your Clipto account? This action is irreversible.')) {
                          setClips([]);
                          localStorage.clear();
                          triggerToast('Account deleted. All data purged.');
                          setTimeout(() => window.location.reload(), 1500);
                        }
                      }}
                      className="text-[10px] text-red-500 hover:underline font-bold mt-2"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* IRON SHIELD CONFIG (PASSCODE LOCK) */}
              {selectedRuneId === '12' && (
                <div className="space-y-4">
                  <div className="divide-y divide-slate-800/40">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h4 className="text-xs font-bold">Passcode Lock</h4>
                        <p className="text-[10px] opacity-50 mt-0.5">
                          {settings.passcodeLockEnabled ? `Lock active (Passcode set)` : 'Requires passcode when launching application'}
                        </p>
                      </div>
                      <Toggle 
                        active={settings.passcodeLockEnabled} 
                        onChange={() => {
                          if (settings.passcodeLockEnabled) {
                            startPasscodeRemoval();
                          } else {
                            startPasscodeSetup();
                          }
                        }} 
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h4 className="text-xs font-bold">Unlock with Fingerprint</h4>
                        <p className="text-[10px] opacity-50 mt-0.5">Allows using native biometrics on support devices</p>
                      </div>
                      <Toggle 
                        active={settings.fingerprintUnlockEnabled} 
                        onChange={() => {
                          updateSetting('fingerprintUnlockEnabled', !settings.fingerprintUnlockEnabled);
                          triggerToast(settings.fingerprintUnlockEnabled ? 'Biometric unlock disabled.' : 'Biometric unlock simulated and active.');
                        }} 
                      />
                    </div>
                  </div>

                  {settings.passcodeLockEnabled && (
                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-center">
                      <p className="text-[10px] text-emerald-400 font-bold">
                        ✓ Shield Engaged: Access is locked automatically after 2 minutes of inactivity.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CHAMELEON SKIN CONFIG (THEMES MOCKUPS) */}
              {selectedRuneId === '2' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.values(themes).map((t) => {
                      const isActive = settings.activeTheme === t.id;
                      return (
                        <div 
                          key={t.id}
                          onClick={() => {
                            updateSetting('activeTheme', t.id);
                            triggerToast(`Theme set to ${t.name}!`);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 relative ${
                            isActive ? 'ring-2 ring-amber-500 border-transparent shadow-xl' : 'border-slate-800 hover:border-slate-600'
                          } ${t.bg}`}
                        >
                          {/* Miniature Mockup */}
                          <div className={`h-12 w-full rounded-lg ${t.sidebarBg} p-1 flex gap-1 border ${t.border}`}>
                            <div className={`w-3 h-full rounded ${t.bg}`}></div>
                            <div className="flex-1 flex flex-col gap-1">
                              <div className={`h-2.5 w-full rounded ${t.cardBg}`}></div>
                              <div className={`h-1.5 w-4/5 rounded ${t.cardBg}`}></div>
                              <div className={`h-1.5 w-1/2 rounded ${t.cardBg}`}></div>
                            </div>
                          </div>

                          {/* Theme name & radio indicator */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold tracking-tight truncate ${t.text}`}>
                              {t.name}
                            </span>
                            <div className={`w-3.5 h-3.5 rounded-full border ${t.radioOutline} flex items-center justify-center`}>
                              {isActive && <div className={`w-2 h-2 rounded-full ${t.accentBg}`}></div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CLIPBOARD CONFIG */}
              {selectedRuneId === '3' && (
                <div className="space-y-4">
                  {/* Clipboard History Banner */}
                  <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-orange-400">Clipboard History Buffer</p>
                      <p className="text-[10px] opacity-75">Access cached system clip records</p>
                    </div>
                    <button 
                      onClick={() => setIsClipboardHistoryOpen(true)}
                      className="px-3 py-1.5 bg-orange-500 text-black text-[9px] font-bold rounded-lg uppercase tracking-wider hover:bg-orange-600 transition-all"
                    >
                      Browse
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800/40 space-y-1">
                    <div className="flex items-center justify-between py-2.5">
                      <div className="pr-4">
                        <h4 className="text-xs font-bold">Notes from Clipboard</h4>
                        <p className="text-[9px] opacity-50 mt-0.5 leading-snug">Automatically creates notes from text copied to clipboard.</p>
                      </div>
                      <Toggle 
                        active={settings.notesFromClipboardEnabled} 
                        onChange={() => updateSetting('notesFromClipboardEnabled', !settings.notesFromClipboardEnabled)} 
                      />
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div className="pr-4">
                        <h4 className="text-xs font-bold">Universal Clipboard</h4>
                        <p className="text-[9px] opacity-50 mt-0.5 leading-snug">Sync clipboard text securely across all registered devices.</p>
                      </div>
                      <Toggle 
                        active={settings.universalClipboardEnabled} 
                        onChange={() => updateSetting('universalClipboardEnabled', !settings.universalClipboardEnabled)} 
                      />
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div className="pr-4">
                        <h4 className="text-xs font-bold">Run at Startup</h4>
                        <p className="text-[9px] opacity-50 mt-0.5 leading-snug">Enable Clipto buffer-monitoring automatically on boot.</p>
                      </div>
                      <Toggle 
                        active={settings.runAtStartupEnabled} 
                        onChange={() => updateSetting('runAtStartupEnabled', !settings.runAtStartupEnabled)} 
                      />
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div className="pr-4">
                        <h4 className="text-xs font-bold">Do not display changed notes</h4>
                        <p className="text-[9px] opacity-50 mt-0.5 leading-snug">Filters tagged or starred clips out of the raw Clipboard feed.</p>
                      </div>
                      <Toggle 
                        active={settings.doNotDisplayChangedNotes} 
                        onChange={() => updateSetting('doNotDisplayChangedNotes', !settings.doNotDisplayChangedNotes)} 
                      />
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <div className="pr-4">
                        <h4 className="text-xs font-bold">Silent notifications</h4>
                        <p className="text-[9px] opacity-50 mt-0.5 leading-snug">Mutes background alert sounds when clips are indexed.</p>
                      </div>
                      <Toggle 
                        active={settings.silentNotificationsEnabled} 
                        onChange={() => updateSetting('silentNotificationsEnabled', !settings.silentNotificationsEnabled)} 
                      />
                    </div>
                  </div>

                  {/* Limit range slider */}
                  <div className="pt-4 border-t border-slate-800/40">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">
                      <span>Clipboard note limit</span>
                      <span className="text-[#fbc02d]">{settings.clipboardLimit === 1000 ? '∞' : `${settings.clipboardLimit} notes`}</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="1000" 
                      step="50"
                      value={settings.clipboardLimit}
                      onChange={(e) => updateSetting('clipboardLimit', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 accent-[#fbc02d] rounded-full appearance-none cursor-pointer" 
                    />
                    <div className="flex justify-between text-[8px] opacity-40 font-bold uppercase mt-1">
                      <span>50</span>
                      <span>500</span>
                      <span>No Limit</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SWIPE POWER CONFIG */}
              {selectedRuneId === '14' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 bg-slate-500/5 rounded-xl border border-slate-700/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Right Swipe gesture</p>
                          <p className="font-bold text-sm">{settings.swipeRightAction}</p>
                        </div>
                      </div>
                      <select 
                        value={settings.swipeRightAction}
                        onChange={(e) => {
                          updateSetting('swipeRightAction', e.target.value);
                          triggerToast(`Right swipe set to ${e.target.value}`);
                        }}
                        className="bg-slate-800 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none font-bold"
                      >
                        {['Copy', 'Edit', 'Tag', 'Favorite', 'Delete'].map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 bg-slate-500/5 rounded-xl border border-slate-700/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-rose-500/10 text-rose-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Left Swipe gesture</p>
                          <p className="font-bold text-sm">{settings.swipeLeftAction}</p>
                        </div>
                      </div>
                      <select 
                        value={settings.swipeLeftAction}
                        onChange={(e) => {
                          updateSetting('swipeLeftAction', e.target.value);
                          triggerToast(`Left swipe set to ${e.target.value}`);
                        }}
                        className="bg-slate-800 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none font-bold"
                      >
                        {['Delete', 'Recycle', 'Share', 'Archive'].map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* INSPIRING SUPPORT LINKS */}
              {selectedRuneId === '15' && (
                <div className="grid grid-cols-1 gap-2.5">
                  <button 
                    onClick={() => triggerToast('Opening Google Play Store rating...')}
                    className="w-full py-3.5 bg-slate-800/40 hover:bg-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-700/60"
                  >
                    Rate Us on Google Play
                  </button>
                  <button 
                    onClick={() => triggerToast('Redirecting to clipto translation hub...')}
                    className="w-full py-3.5 bg-slate-800/40 hover:bg-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-700/60"
                  >
                    Help Us with Translation
                  </button>
                  <button 
                    onClick={() => triggerToast('Loading issue tracker dashboard...')}
                    className="w-full py-3.5 bg-slate-800/40 hover:bg-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-700/60"
                  >
                    Report an Issue
                  </button>
                  <button 
                    onClick={() => triggerToast('Application share URL copied!')}
                    className="w-full py-3.5 bg-slate-800/40 hover:bg-slate-800 text-xs font-bold rounded-xl transition-all border border-slate-700/60"
                  >
                    Share App Link
                  </button>
                </div>
              )}

              {/* GENERIC CONFIG PANEL FOR PASSIVE RUNES */}
              {detail?.type === 'generic' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-300">Rune Core Status</span>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Engaged & Syncing
                    </span>
                  </div>

                  <button 
                    onClick={() => triggerToast(`${detail.name} capability refreshed.`)}
                    className="w-full py-3 bg-[#fbc02d] text-black hover:bg-amber-500 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Force Sync index
                  </button>
                </div>
              )}

              {/* REMAINING 9 RUNES (DOCK TO MAIN Grid BUT CUSTOM CHANNELS) */}
              {!['1', '12', '2', '3', '14', '15', '4', '13'].includes(selectedRuneId) && (
                <div className="space-y-4">
                  {/* Point of No Return / Self Destruction */}
                  {selectedRuneId === '6' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Self-destruct note immediately on viewing</span>
                        <Toggle active={false} onChange={() => triggerToast('Self destruction protocol primed.')} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Wipe local recycle bin weekly</span>
                        <Toggle active={true} />
                      </div>
                    </div>
                  )}

                  {/* Shifted Focus / Pomodoro Focus Mode */}
                  {selectedRuneId === '7' && (
                    <div className="space-y-4 text-center">
                      <p className="text-xs text-slate-400">Pair your writing notes with deep focus Pomodoro timers.</p>
                      <button 
                        onClick={() => triggerToast('Pomodoro focus block started (25:00)!')}
                        className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all w-full"
                      >
                        Start Focus Mode block
                      </button>
                      <div className="flex items-center justify-between text-left pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-xs font-bold block">Ambient Background Sounds</span>
                          <span className="text-[10px] opacity-50 block">Plays rain static or cafes soundscape</span>
                        </div>
                        <Toggle active={true} />
                      </div>
                    </div>
                  )}

                  {/* Tentative Steps / Reset onboarding */}
                  {selectedRuneId === '11' && (
                    <div className="text-center py-2 space-y-3">
                      <p className="text-xs text-slate-400">View logs of past edits or trigger the initial app guide.</p>
                      <button 
                        onClick={() => triggerToast('Launching walkthrough guide tour...')}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Launch Interactive Guide
                      </button>
                    </div>
                  )}

                  {/* Revive / Backups */}
                  {selectedRuneId === '8' && (
                    <div className="space-y-3 pt-2 text-left">
                      <div className="flex items-center justify-between py-2.5 mb-2 border-b border-slate-800/60 pb-3">
                        <div className="pr-4">
                          <h4 className="text-xs font-bold">Preserve Collapsed States (Revive)</h4>
                          <p className="text-[9px] opacity-50 mt-0.5 leading-snug">Saves the expanded/collapsed state of accordion sections between navigation sessions.</p>
                        </div>
                        <Toggle 
                          active={!!settings.reviveEnabled} 
                          onChange={() => {
                            const nextVal = !settings.reviveEnabled;
                            updateSetting('reviveEnabled', nextVal);
                            triggerToast(nextVal ? 'Preservation of collapse states enabled!' : 'State preservation disabled.');
                          }} 
                        />
                      </div>
                      
                      <button 
                        onClick={() => {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clips));
                          const dlAnchorElem = document.createElement('a');
                          dlAnchorElem.setAttribute("href",     dataStr     );
                          dlAnchorElem.setAttribute("download", "clipto-database-backup.json");
                          dlAnchorElem.click();
                          triggerToast('Backup database JSON download started.');
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Create Local JSON Backup
                      </button>
                      <button 
                        onClick={() => triggerToast('Database backup loaded and index restored.')}
                        className="w-full py-3 border border-slate-700/60 text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-500/5 transition-all"
                      >
                        Restore database from file
                      </button>
                    </div>
                  )}

                  {/* Time Machine / Revisions */}
                  {selectedRuneId === '16' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span>Save edit history revisions</span>
                        <Toggle active={true} />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>Max versions kept per note</span>
                        <span className="text-amber-400 font-bold">10 versions</span>
                      </div>
                    </div>
                  )}

                  {/* Blowing Copy */}
                  {selectedRuneId === '5' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span>Copy on Shaking Device</span>
                        <Toggle active={true} />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>Mute copy audio signals</span>
                        <Toggle active={false} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 italic text-center mt-6 leading-relaxed opacity-70">
              Effects take place instantly. Saved settings are cached on-device securely.
            </p>
          </div>
        )}
      </div>
    </div>

      {/* FOOTER TOAST NOTIFICATIONS */}
      {toastMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-slate-100 text-xs font-bold rounded-lg border border-slate-700/80 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* HELP DIALOGUE POPUP */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsHelpOpen(false)}>
          <div className="bg-[#262626] border border-slate-700 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-amber-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-bold text-sm text-slate-100">About Skill Runes</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Skill Runes are auxiliary modifiers that customize Clipto's system behavior. You can trigger biometric locking, automate clipboard monitoring, configure swipe patterns, or apply custom palettes instantly.
            </p>
            <button 
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700/60 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* CLIPBOARD HISTORY BUFFER OVERLAY */}
      {isClipboardHistoryOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsClipboardHistoryOpen(false)}>
          <div className="bg-[#262626] border border-slate-700 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-orange-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h4 className="font-bold text-sm text-slate-100">Simulated Clipboard History</h4>
              </div>
              <button onClick={() => setIsClipboardHistoryOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              These elements represent text currently copied on your system buffer cache. Click any element to create a real note snippet inside Clipto immediately.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {mockClipboardItems.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleImportClipboardHistory(item)}
                  className="p-3 bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-700/60 cursor-pointer transition-all group flex items-start justify-between"
                >
                  <pre className="font-mono text-[10px] text-slate-300 leading-snug whitespace-pre-wrap truncate flex-1 pr-3">
                    {item}
                  </pre>
                  <span className="text-[9px] text-[#fbc02d] opacity-0 group-hover:opacity-100 font-bold uppercase shrink-0">
                    Import note +
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE NUMPAD SETTINGS MODAL (FOR PASSCODE LOCK SETUP) */}
      {passcodeStage !== 'none' && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-slate-800 p-6 rounded-[2rem] max-w-sm w-full shadow-2xl flex flex-col items-center">
            {/* Lock illustration */}
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h4 className="font-bold text-slate-100 text-sm tracking-tight text-center mb-1">
              {passcodeStage === 'enter' && 'Enter a 4-Digit Passcode'}
              {passcodeStage === 'confirm' && 'Confirm Your Passcode'}
              {passcodeStage === 'input-current' && 'Enter Current Passcode to Disable'}
            </h4>
            <p className="text-[10px] text-slate-500 text-center mb-6">
              {passcodeStage === 'confirm' ? 'Must match your initial passcode entry' : 'Allows you to lock/unlock Clipto anytime'}
            </p>

            {/* Passcode dots */}
            <div className="flex gap-4 mb-8">
              {[0, 1, 2, 3].map((idx) => {
                const filled = passcodeDigits.length > idx;
                return (
                  <div 
                    key={idx} 
                    className={`w-3.5 h-3.5 rounded-full border border-slate-700 transition-all duration-150 ${
                      filled ? 'bg-amber-400 border-transparent scale-110' : 'bg-transparent'
                    } ${passcodeError ? 'bg-red-500 border-transparent animate-ping' : ''}`}
                  ></div>
                );
              })}
            </div>

            {/* Passcode Num Pad Grid */}
            <div className="grid grid-cols-3 gap-4 max-w-xs w-full mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button 
                  key={num}
                  onClick={() => handleNumpadClick(num)}
                  className="w-14 h-14 bg-slate-800/40 hover:bg-slate-800 text-slate-200 font-bold rounded-full text-lg flex items-center justify-center transition-all active:scale-90 border border-slate-800"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={() => setPasscodeStage('none')}
                className="w-14 h-14 text-slate-500 font-bold text-xs flex items-center justify-center hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleNumpadClick('0')}
                className="w-14 h-14 bg-slate-800/40 hover:bg-slate-800 text-slate-200 font-bold rounded-full text-lg flex items-center justify-center transition-all active:scale-90 border border-slate-800"
              >
                0
              </button>
              <button 
                onClick={handleNumpadBackspace}
                className="w-14 h-14 text-slate-500 font-bold flex items-center justify-center hover:text-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0010.828 5H20a2 2 0 012 2v10a2 2 0 01-2 2h-9.172a2 2 0 01-1.414-.586L3 12z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillRunes;
