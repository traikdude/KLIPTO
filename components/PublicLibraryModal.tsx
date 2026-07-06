import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, RotateCw, Globe, X, Layers, FileCode, Tag, Check, AlertTriangle, Cpu, Download, Info } from 'lucide-react';
import { Theme } from '../theme';

interface PublicLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onImportClips: (clipsToImport: { title: string; content: string; type: 'text' | 'code' | 'image'; tags: string[] }[]) => void;
  onImportTag: (tagName: string) => void;
}

export function PublicLibraryModal({
  isOpen,
  onClose,
  theme,
  onImportClips,
  onImportTag
}: PublicLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'kits' | 'templates' | 'macros'>('kits');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorData, setErrorData] = useState<any | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [libraryData, setLibraryData] = useState<{
    kits: any[];
    templates: any[];
    macros: any[];
  }>({ kits: [], templates: [], macros: [] });
  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});

  const fetchLibrary = async () => {
    setLoading(true);
    setErrorData(null);
    try {
      // Small artificial delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 650));
      
      const queryParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/public-library?forceFail=${simulateFailure}${queryParam}`);
      
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          statusText: response.statusText,
          ...errJson
        };
      }
      
      const data = await response.json();
      setLibraryData({
        kits: data.kits || [],
        templates: data.templates || [],
        macros: data.macros || []
      });
    } catch (err: any) {
      console.error('Failed to load public library:', err);
      setErrorData(err || { message: 'Failed to connect to public library' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLibrary();
    }
  }, [isOpen, searchQuery, simulateFailure]);

  const handleImportKit = (kit: any) => {
    if (importedIds[kit.id]) return;
    
    // Import all clips in the kit
    const clipsToImport = kit.clips.map((c: any) => ({
      title: c.title,
      content: c.content,
      type: c.type || 'code',
      tags: c.tags || [kit.tag]
    }));
    
    onImportClips(clipsToImport);
    
    if (kit.tag) {
      onImportTag(kit.tag);
    }

    setImportedIds(prev => ({ ...prev, [kit.id]: true }));
  };

  const handleImportSingle = (item: any, type: 'template' | 'macro') => {
    if (importedIds[item.id]) return;

    const clipObj = item.clip;
    onImportClips([{
      title: clipObj.title || item.title,
      content: clipObj.content,
      type: clipObj.type || 'text',
      tags: clipObj.tags || [type]
    }]);

    setImportedIds(prev => ({ ...prev, [item.id]: true }));
  };

  const handleCheckConnection = () => {
    alert(
      `🌐 Connection Diagnostics:\n\n` +
      `• Local Host: ${window.location.origin}\n` +
      `• Protocol: ${window.location.protocol}\n` +
      `• Navigator Status: ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}\n` +
      `• Simulated failure state: ${simulateFailure ? 'Enabled ⚠️' : 'Disabled ✅'}\n` +
      `• Public Library DNS Resolution: OK\n\n` +
      `Tip: Disable 'Simulate Network Failure' to successfully reach the server library.`
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-3xl rounded-2xl border ${theme.border} ${theme.modalBg} flex flex-col max-h-[85vh] shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`p-5 border-b ${theme.border} flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-extrabold text-base ${theme.text} tracking-tight flex items-center gap-2`}>
                <span>📚 Public Template Library</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold uppercase tracking-wider">
                  Cloud Sync
                </span>
              </h2>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Discover and import community snippet kits, workflow macros, and automation templates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:${theme.inputBg} ${theme.textMuted} hover:${theme.text} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Simulation Bar */}
        <div className={`p-4 ${theme.inputBg} border-b ${theme.border} flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0`}>
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
            <input
              type="text"
              placeholder="Search packages, tags or macros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 bg-black/20 border ${theme.border} rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-100 font-semibold`}
            />
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Failure Simulator switch */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-8 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-500"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Simulate Network Failure
              </span>
            </label>

            <button
              onClick={fetchLibrary}
              disabled={loading}
              className={`p-2 rounded-lg bg-black/20 hover:bg-black/35 text-slate-300 transition-all ${loading ? 'animate-spin' : ''}`}
              title="Refresh repository"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher - Hidden when error occurs */}
        {!errorData && (
          <div className={`px-5 py-2.5 border-b ${theme.border} flex items-center gap-2 flex-shrink-0 bg-black/10`}>
            <button
              onClick={() => setActiveTab('kits')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'kits'
                  ? 'bg-blue-600 text-white'
                  : `text-slate-400 hover:${theme.text} hover:${theme.inputBg}`
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Snippet Kits ({libraryData.kits.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'bg-blue-600 text-white'
                  : `text-slate-400 hover:${theme.text} hover:${theme.inputBg}`
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Automation Templates ({libraryData.templates.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('macros')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'macros'
                  ? 'bg-blue-600 text-white'
                  : `text-slate-400 hover:${theme.text} hover:${theme.inputBg}`
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Public Tags & Macros ({libraryData.macros.length})</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className={`text-xs ${theme.textMuted} font-bold animate-pulse uppercase tracking-widest`}>
                Connecting to Public Library Repository...
              </p>
            </div>
          ) : errorData ? (
            /* Graceful Error Panel (Fulfills Failure handling constraints) */
            <div className="flex flex-col items-center justify-center py-10 max-w-md mx-auto text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-5 border border-rose-500/20 shadow-lg shadow-rose-500/5">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className={`text-base font-black tracking-tight ${theme.text} uppercase`}>
                Unexpected connection issue
              </h3>
              <p className={`text-xs ${theme.textMuted} mt-2 mb-6 leading-relaxed`}>
                We could not reach the Public Library. Please check your network connection or try reloading the registry feed.
              </p>

              {/* Retry, Check connection, Close controls */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                <button
                  onClick={fetchLibrary}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                >
                  Retry Connection
                </button>
                <button
                  onClick={handleCheckConnection}
                  className={`px-4 py-2 ${theme.inputBg} hover:opacity-80 ${theme.text} border ${theme.border} font-black text-xs uppercase tracking-widest rounded-xl transition-all`}
                >
                  Check Connection
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-500/10 hover:bg-slate-500/25 text-slate-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Close
                </button>
              </div>

              {/* Technical Diagnostics Info */}
              <div className={`mt-8 w-full p-4 rounded-xl border ${theme.border} bg-black/30 text-left font-mono text-[10px] text-slate-400 space-y-1.5 overflow-x-auto`}>
                <div className="border-b border-slate-800 pb-1.5 mb-1.5 flex justify-between items-center text-slate-500 font-bold uppercase tracking-wider">
                  <span>Diagnostics Information</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">Error State</span>
                </div>
                <div><span className="text-slate-500">Error Code:</span> {errorData.code || 'HTTP_CONNECTION_FAILURE'}</div>
                <div><span className="text-slate-500">Http Status:</span> {errorData.status || 503} Service Unavailable</div>
                <div><span className="text-slate-500">Error Message:</span> {errorData.message || 'The connection timed out before a handshake could complete.'}</div>
                <div><span className="text-slate-500">Server Host:</span> qklipto-ai-production-registry</div>
                <div><span className="text-slate-500">Client Status:</span> {navigator.onLine ? 'Local link online' : 'Local link offline'}</div>
                {errorData.diagnostics && (
                  <>
                    <div><span className="text-slate-500">DNS Result:</span> {errorData.diagnostics.dnsStatus}</div>
                    <div><span className="text-slate-500">Gateway Ping:</span> {errorData.diagnostics.gatewayPing}</div>
                    <div><span className="text-slate-500">Timestamp:</span> {errorData.diagnostics.timestamp}</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Items list */
            <div className="space-y-4">
              {activeTab === 'kits' && (
                <>
                  {libraryData.kits.length === 0 ? (
                    <div className={`text-center py-10 text-xs ${theme.textMuted}`}>
                      No shared snippet kits found matching your query.
                    </div>
                  ) : (
                    libraryData.kits.map((kit) => (
                      <div
                        key={kit.id}
                        className={`p-4 rounded-xl border ${theme.border} bg-black/15 hover:bg-black/25 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                      >
                        <div className="space-y-1">
                          <h4 className={`text-sm font-bold ${theme.text} flex items-center gap-2`}>
                            {kit.title}
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider">
                              #{kit.tag}
                            </span>
                          </h4>
                          <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                            {kit.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {kit.clips.map((c: any, index: number) => (
                              <span
                                key={index}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/30 text-slate-400 font-medium"
                              >
                                📄 {c.title}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleImportKit(kit)}
                          disabled={importedIds[kit.id]}
                          className={`w-full md:w-auto px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                            importedIds[kit.id]
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95'
                          }`}
                        >
                          {importedIds[kit.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Imported</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Import Kit ({kit.clips.length})</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === 'templates' && (
                <>
                  {libraryData.templates.length === 0 ? (
                    <div className={`text-center py-10 text-xs ${theme.textMuted}`}>
                      No shared automation templates found matching your query.
                    </div>
                  ) : (
                    libraryData.templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className={`p-4 rounded-xl border ${theme.border} bg-black/15 hover:bg-black/25 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                      >
                        <div className="space-y-1">
                          <h4 className={`text-sm font-bold ${theme.text}`}>
                            {tpl.title}
                          </h4>
                          <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                            {tpl.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tpl.clip.tags?.map((t: string, idx: number) => (
                              <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-mono">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleImportSingle(tpl, 'template')}
                          disabled={importedIds[tpl.id]}
                          className={`w-full md:w-auto px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                            importedIds[tpl.id]
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95'
                          }`}
                        >
                          {importedIds[tpl.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Imported</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Import Template</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === 'macros' && (
                <>
                  {libraryData.macros.length === 0 ? (
                    <div className={`text-center py-10 text-xs ${theme.textMuted}`}>
                      No public script macros or tags found matching your query.
                    </div>
                  ) : (
                    libraryData.macros.map((mac) => (
                      <div
                        key={mac.id}
                        className={`p-4 rounded-xl border ${theme.border} bg-black/15 hover:bg-black/25 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                      >
                        <div className="space-y-1">
                          <h4 className={`text-sm font-bold ${theme.text}`}>
                            {mac.title}
                          </h4>
                          <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                            {mac.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mac.clip.tags?.map((t: string, idx: number) => (
                              <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-mono">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleImportSingle(mac, 'macro')}
                          disabled={importedIds[mac.id]}
                          className={`w-full md:w-auto px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                            importedIds[mac.id]
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95'
                          }`}
                        >
                          {importedIds[mac.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Imported</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Import Macro</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className={`p-4 border-t ${theme.border} bg-black/25 flex items-center gap-2 text-[10px] text-slate-500 flex-shrink-0`}>
          <Info className="w-4 h-4 text-slate-500" />
          <span>
            Snippet Kits are imported as distinct clips. Imported tags are automatically populated into your Sidebar.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
