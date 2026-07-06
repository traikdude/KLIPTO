import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  Search, 
  Layers, 
  Copy, 
  FileCode, 
  Download, 
  Upload, 
  Share2, 
  CornerDownLeft, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';
import { Theme } from '../theme';
import { Clip, ClipType } from '../types';

interface SnippetKit {
  id: string;
  name: string;
  tag: string;
  color: string;
}

interface KeyboardCompanionProps {
  theme: Theme;
  clips: Clip[];
  snippetKits: SnippetKit[];
  setSnippetKits: React.Dispatch<React.SetStateAction<SnippetKit[]>>;
  onImportClips: (clipsToImport: { title: string; content: string; type: 'text' | 'code' | 'image'; tags: string[] }[]) => void;
  onAddClip: (title: string, content: string, type: ClipType, tags: string[]) => void;
  onSelectClipToEdit?: (clip: Clip) => void;
}

export default function KeyboardCompanion({
  theme,
  clips,
  snippetKits,
  setSnippetKits,
  onImportClips,
  onAddClip,
  onSelectClipToEdit
}: KeyboardCompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState<string>(snippetKits[0]?.id || 'kit-all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync state with global notification system
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('qlipto_sys_notification', {
      detail: {
        id: 'daemon-keyboard',
        title: 'Keyboard Companion overlay active.',
        description: isOpen 
          ? 'Virtual snippets injection panel is expanded and responsive.' 
          : 'Keyboard companion window is currently closed.',
        status: isOpen ? 'active' : 'info'
      }
    }));
  }, [isOpen]);
  
  // Local variables expander state
  const [expandingClip, setExpandingClip] = useState<Clip | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Audio simulator for mechanical keyboard sounds
  const playTypeSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(120 + Math.random() * 80, audioCtx.currentTime); // keyboard click pitch
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // AudioContext blocked or unsupported
    }
  };

  // Find clips belonging to active kit (based on kit tag)
  const activeKit = useMemo(() => {
    return snippetKits.find(k => k.id === selectedKitId);
  }, [snippetKits, selectedKitId]);

  const kitClips = useMemo(() => {
    return clips.filter(clip => {
      if (clip.isDeleted) return false;
      if (selectedKitId === 'kit-all') return true;
      if (!activeKit) return false;
      return clip.tags.some(t => t.toLowerCase() === activeKit.tag.toLowerCase());
    });
  }, [clips, selectedKitId, activeKit]);

  // Apply search query
  const searchedClips = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return kitClips;
    return kitClips.filter(c => 
      (c.title || '').toLowerCase().includes(q) || 
      (c.content || '').toLowerCase().includes(q)
    );
  }, [kitClips, searchQuery]);

  // Insert snippet helper: targets any active textarea/input on the page
  const handleInsertSnippet = (content: string) => {
    playTypeSound();
    
    // Find active element
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
      const input = activeEl as HTMLInputElement | HTMLTextAreaElement;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = input.value;
      
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      input.value = before + content + after;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Reset cursor
      const newPos = start + content.length;
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(newPos, newPos);
      }, 50);
      
      // Visual feedback
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: 'Snippet injected successfully ✅', type: 'success' }
      }));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(content);
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: 'Copied to clipboard ✅', type: 'success' }
      }));
    }
  };

  // Copy helper
  const handleCopy = (clip: Clip) => {
    playTypeSound();
    const hasVariables = /\{\{(.*?)\}\}/.test(clip.content || '');
    
    if (hasVariables) {
      // Parse variables
      const matches = clip.content.match(/\{\{(.*?)\}\}/g) || [];
      const vars: Record<string, string> = {};
      matches.forEach(m => {
        const cleanVar = m.replace('{{', '').replace('}}', '');
        vars[cleanVar] = '';
      });
      
      setVariableValues(vars);
      setExpandingClip(clip);
    } else {
      navigator.clipboard.writeText(clip.content);
      setCopiedId(clip.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleVariableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandingClip) return;
    
    let compiled = expandingClip.content;
    Object.entries(variableValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      let finalVal = (value as string).trim();
      
      if (!finalVal) {
        if (key === 'date') {
          finalVal = new Date().toLocaleDateString();
        } else if (key.startsWith('blank:')) {
          finalVal = `[${key.substring(6)}]`;
        } else if (key.startsWith('ai_prompt:')) {
          finalVal = `[AI Goal: ${key.substring(10)}]`;
        } else {
          finalVal = `[${key}]`;
        }
      }
      
      compiled = compiled.replaceAll(placeholder, finalVal);
    });
    
    handleInsertSnippet(compiled);
    setExpandingClip(null);
    setVariableValues({});
  };

  // Export Kit
  const handleExportKit = (kit: SnippetKit) => {
    const matchingClips = clips.filter(c => 
      !c.isDeleted && c.tags.some(t => t.toLowerCase() === kit.tag.toLowerCase())
    );
    
    const exportPayload = {
      kit,
      clips: matchingClips.map(c => ({
        title: c.title,
        content: c.content,
        type: c.type,
        tags: c.tags
      })),
      exportedAt: Date.now(),
      app: 'Qklipto Snippet Kit'
    };
    
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kit-backup-${kit.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`📥 Snippet Kit "${kit.name}" exported successfully with ${matchingClips.length} snippets!`);
  };

  // Import Kit
  const handleImportKitClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (parsed.kit && Array.isArray(parsed.clips)) {
              // Register Kit metadata
              const newKit: SnippetKit = {
                id: `kit-${Date.now()}`,
                name: `${parsed.kit.name} (Imported)`,
                tag: parsed.kit.tag || `imported-${Date.now()}`,
                color: parsed.kit.color || 'text-purple-400'
              };
              
              setSnippetKits(prev => {
                if (prev.some(k => k.tag.toLowerCase() === newKit.tag.toLowerCase())) {
                  return prev; // Avoid duplicates
                }
                return [...prev, newKit];
              });
              
              // Register associated Clips
              onImportClips(parsed.clips);
              setSelectedKitId(newKit.id);
            } else {
              alert('⚠️ File is not a valid Qklipto Snippet Kit archive.');
            }
          } catch (err) {
            alert('⚠️ Failed to parse snippet kit JSON archive.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Share kit on Public Library Simulation
  const handleShareKit = (kit: SnippetKit) => {
    const matchingClips = clips.filter(c => 
      !c.isDeleted && c.tags.some(t => t.toLowerCase() === kit.tag.toLowerCase())
    );
    
    if (matchingClips.length === 0) {
      alert(`⚠️ Cannot share kit "${kit.name}" because it currently has 0 active snippets tagged with "#${kit.tag}". Assign some clips to this kit first!`);
      return;
    }
    
    alert(
      `🌐 Sharing Snippet Kit:\n\n` +
      `• Kit Name: ${kit.name}\n` +
      `• Unique Tag: #${kit.tag}\n` +
      `• Total Snippets: ${matchingClips.length} items\n\n` +
      `🎉 Success! Your kit has been indexed in the secure Qklipto Public Library database. Other community members can now fetch and deploy it!`
    );
  };

  return (
    <>
      {/* FLOATING ACTION TRIGGER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-2xl z-40 transition-transform active:scale-90 duration-150"
        title="Toggle Keyboard Companion"
      >
        <Keyboard className="w-6 h-6 animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className={`fixed bottom-24 right-6 w-[360px] sm:w-[420px] rounded-2xl border ${theme.border} ${theme.modalBg} shadow-2xl z-40 overflow-hidden flex flex-col`}
            style={{ maxHeight: isMinimized ? '52px' : '520px' }}
          >
            {/* Header */}
            <div className={`p-3.5 border-b ${theme.border} bg-slate-900/50 flex items-center justify-between flex-shrink-0`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>Keyboard Companion</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Virtual Snippets Injector</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Sound toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg hover:${theme.inputBg} text-slate-400 transition-colors`}
                  title={soundEnabled ? "Mute Mechanical Sound" : "Enable Mechanical Sound"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Import Kit button */}
                <button
                  onClick={handleImportKitClick}
                  className={`p-1.5 rounded-lg hover:${theme.inputBg} text-slate-400 transition-colors`}
                  title="Import Snippet Kit JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>

                {/* Minimize toggle */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className={`p-1.5 rounded-lg hover:${theme.inputBg} text-slate-400 transition-colors`}
                >
                  {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg hover:${theme.inputBg} text-slate-400 transition-colors`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Search Bar */}
                <div className={`p-2.5 bg-black/20 border-b ${theme.border} flex items-center gap-2 flex-shrink-0`}>
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search snippets within kit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 bg-black/20 border ${theme.border} rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500 text-slate-200`}
                    />
                  </div>
                </div>

                {/* Kits Quick Selector Tab strip */}
                <div className={`px-3 py-2 border-b ${theme.border} bg-slate-900/10 flex items-center gap-1.5 overflow-x-auto flex-shrink-0 select-none scrollbar-none`}>
                  <button
                    onClick={() => {
                      playTypeSound();
                      setSelectedKitId('kit-all');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 uppercase tracking-wider ${
                      selectedKitId === 'kit-all'
                        ? 'bg-slate-700 text-white font-extrabold shadow'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-500/5'
                    }`}
                  >
                    All Kit Items
                  </button>

                  {snippetKits.map(kit => (
                    <button
                      key={kit.id}
                      onClick={() => {
                        playTypeSound();
                        setSelectedKitId(kit.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 uppercase tracking-wider ${
                        selectedKitId === kit.id
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : `${kit.color} hover:bg-slate-500/5`
                      }`}
                    >
                      <span>{kit.name}</span>
                    </button>
                  ))}
                </div>

                {/* Active Kit Info Toolbar */}
                {activeKit && selectedKitId !== 'kit-all' && (
                  <div className={`px-4 py-1.5 border-b ${theme.border} bg-black/10 flex items-center justify-between text-[10px] text-slate-400 flex-shrink-0 font-semibold`}>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span>Tag: <span className="font-mono text-amber-500 font-bold">#{activeKit.tag}</span></span>
                      <span>•</span>
                      <span>{kitClips.length} items</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportKit(activeKit)}
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-bold"
                        title="Export Kit as JSON file"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export</span>
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => handleShareKit(activeKit)}
                        className="text-slate-400 hover:text-amber-500 flex items-center gap-1 font-bold"
                        title="Publish Kit to Library"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Snippets Scroll container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px]">
                  {searchedClips.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Info className="w-6 h-6 text-slate-600 mx-auto" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">No snippets in this Kit</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                        {selectedKitId === 'kit-all' 
                          ? "Write some snippets or connect folders to begin."
                          : `Create a note or add the tag "#${activeKit?.tag}" to assign templates to this kit.`
                        }
                      </p>
                    </div>
                  ) : (
                    searchedClips.map((clip) => {
                      const isCode = clip.type === ClipType.CODE;
                      const hasVariables = /\{\{(.*?)\}\}/.test(clip.content || '');

                      return (
                        <div
                          key={clip.id}
                          className={`p-2.5 rounded-xl border ${theme.border} bg-black/15 hover:bg-black/35 transition-all flex items-start justify-between gap-3 group`}
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              {isCode ? (
                                <FileCode className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                              ) : (
                                <span className="text-[10px] flex-shrink-0">📝</span>
                              )}
                              <h4 className={`text-xs font-bold truncate ${theme.text}`}>
                                {clip.title || "Untitled Snippet"}
                              </h4>
                              {hasVariables && (
                                <span className="text-[8px] font-black px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest flex items-center gap-0.5">
                                  <Sparkles className="w-2 h-2" />
                                  <span>Vars</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono line-clamp-2 truncate whitespace-pre-wrap select-all">
                              {clip.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Insert Trigger */}
                            <button
                              onClick={() => {
                                if (hasVariables) {
                                  handleCopy(clip);
                                } else {
                                  handleInsertSnippet(clip.content);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-all flex items-center justify-center border border-blue-600/25"
                              title="Inject directly into active document"
                            >
                              <CornerDownLeft className="w-3 h-3" />
                            </button>

                            {/* Copy Trigger */}
                            <button
                              onClick={() => handleCopy(clip)}
                              className={`p-1.5 rounded-lg transition-all flex items-center justify-center border ${
                                copiedId === clip.id
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                  : 'bg-slate-500/5 hover:bg-slate-500/15 border-slate-700/20 text-slate-400 hover:text-slate-200'
                              }`}
                              title="Copy snippet"
                            >
                              {copiedId === clip.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Mini instruction label */}
                <div className={`p-2.5 bg-black/35 border-t ${theme.border} flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider flex-shrink-0 select-none`}>
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tip: Focus any text input field, then tap the injection icon ↵</span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER INLINE VARIABLES COMPILING OVERLAY FOR COMPANION INJECTS */}
      <AnimatePresence>
        {expandingClip && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm rounded-xl border ${theme.border} ${theme.modalBg} p-5 space-y-4 shadow-2xl`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                <h3 className={`text-xs font-black uppercase tracking-wider ${theme.text} flex items-center gap-1.5`}>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Resolve Snippet Placeholders</span>
                </h3>
                <button
                  onClick={() => setExpandingClip(null)}
                  className="text-slate-500 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleVariableSubmit} className="space-y-3">
                {Object.keys(variableValues).map((key) => {
                  let placeholderLabel = key;
                  let placeholderTip = "Manual text value...";
                  if (key === 'date') {
                    placeholderLabel = '📅 Date (defaults to today)';
                    placeholderTip = 'Current date or custom string...';
                  } else if (key.startsWith('blank:')) {
                    placeholderLabel = `✏️ Manual Blank: ${key.substring(6)}`;
                    placeholderTip = 'Type manual insert value...';
                  } else if (key.startsWith('ai_prompt:')) {
                    placeholderLabel = `🧠 AI Context: ${key.substring(10)}`;
                    placeholderTip = 'Specify goal instructions segment...';
                  }

                  return (
                    <div key={key} className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        {placeholderLabel}
                      </label>
                      <input
                        type="text"
                        value={variableValues[key]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariableValues(prev => ({ ...prev, [key]: val }));
                        }}
                        placeholder={placeholderTip}
                        className={`w-full px-3 py-1.5 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500`}
                        autoFocus
                      />
                    </div>
                  );
                })}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandingClip(null)}
                    className="flex-1 py-2 rounded-xl bg-slate-500/5 hover:bg-slate-500/10 text-slate-400 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-md"
                  >
                    Resolve & Inject
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
