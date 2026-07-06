import React, { useState, useEffect, useRef } from 'react';
import { Clip, ClipType, NoteAttachment } from '../types';
import { analyzeContent, analyzeImage } from '../services/geminiService';
import { Theme } from '../theme';
import { saveAttachment, getAttachment, deleteAttachment } from '../services/attachmentStore';
import { MediaCaptureModal } from './MediaCaptureModal';

interface ClipDetailsModalProps {
  clip: Clip;
  onClose: () => void;
  onUpdate: (updatedClip: Clip) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  theme: Theme;
  folders: { id: string; name: string }[];
  onCopy?: (clip: Clip) => void;
  snippetKits: { id: string; name: string; tag: string; color: string }[];
}

const ClipDetailsModal: React.FC<ClipDetailsModalProps> = ({ 
  clip, 
  onClose, 
  onUpdate, 
  onDelete,
  onRestore,
  onDeletePermanently,
  theme,
  folders,
  onCopy,
  snippetKits
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [title, setTitle] = useState(clip.title);
  const [content, setContent] = useState(clip.content);
  const [folderId, setFolderId] = useState(clip.folderId || 'folder-root');
  const [tags, setTags] = useState(clip.tags);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'attachments' | 'sharing'>('general');
  const [activeKitTag, setActiveKitTag] = useState<string>(() => {
    const foundKit = snippetKits.find(kit => clip.tags.some(t => t.toLowerCase() === kit.tag.toLowerCase()));
    return foundKit ? foundKit.tag : '';
  });

  const [activeCaptureMode, setActiveCaptureMode] = useState<'photo' | 'video' | 'audio' | 'barcode' | null>(null);
  const [resolvedUris, setResolvedUris] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePreviewMetadataAndThumbnail = (file: File | Blob, type: "image" | "video" | "audio" | "pdf" | "file"): Promise<{ thumbnailUrl?: string; previewMetadata?: { width?: number; height?: number; duration?: number } }> => {
    return new Promise((resolve) => {
      if (type === 'image') {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          
          const canvas = document.createElement('canvas');
          const maxDim = 120;
          let w = width;
          let h = height;
          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            try {
              const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
              URL.revokeObjectURL(url);
              resolve({ thumbnailUrl, previewMetadata: { width, height } });
              return;
            } catch (e) {}
          }
          URL.revokeObjectURL(url);
          resolve({ previewMetadata: { width, height } });
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({});
        };
        img.src = url;
      } else if (type === 'video' || type === 'audio') {
        const url = URL.createObjectURL(file);
        const media = document.createElement(type);
        media.preload = 'metadata';
        media.onloadedmetadata = () => {
          const duration = media.duration;
          URL.revokeObjectURL(url);
          resolve({ previewMetadata: { duration } });
        };
        media.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({});
        };
        media.src = url;
      } else {
        resolve({});
      }
    });
  };

  const getAttachmentType = (mimeType: string, fileName: string): "image" | "video" | "audio" | "pdf" | "file" => {
    const mime = mimeType.toLowerCase();
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
    return 'file';
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    let active = true;
    const uris: Record<string, string> = {};
    
    const resolveAll = async () => {
      if (!clip.attachments) return;
      for (const attachment of clip.attachments) {
        try {
          const fileData = await getAttachment(attachment.id);
          if (fileData && active) {
            const url = URL.createObjectURL(fileData.data);
            uris[attachment.id] = url;
          }
        } catch (err) {
          console.error("Failed to resolve attachment:", attachment.id, err);
        }
      }
      if (active) {
        setResolvedUris(uris);
      }
    };

    resolveAll();

    return () => {
      active = false;
      Object.values(uris).forEach(url => URL.revokeObjectURL(url));
    };
  }, [clip.attachments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_BYTES = 300 * 1024 * 1024; // 300 MB
    if (file.size > MAX_SIZE_BYTES) {
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: 'File exceeds 300 MB limit 🚫', type: 'error' }
      }));
      window.dispatchEvent(new CustomEvent('qlipto_sys_notification', {
        detail: {
          id: 'sys-large-file-' + Date.now(),
          title: 'File too large.',
          description: `Upload denied. File "${file.name}" exceeds the maximum limit of 300 MB.`,
          status: 'warning'
        }
      }));
      return;
    }

    const attachmentId = 'attach-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    
    const attachmentFile = {
      id: attachmentId,
      name: file.name,
      size: file.size,
      type: file.type,
      data: file,
      timestamp: Date.now()
    };
    await saveAttachment(attachmentFile);

    const type = getAttachmentType(file.type, file.name);
    const { thumbnailUrl, previewMetadata } = await generatePreviewMetadataAndThumbnail(file, type);

    const newAttachment: NoteAttachment = {
      id: attachmentId,
      noteId: clip.id,
      type,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      localUri: `indexeddb://${attachmentId}`,
      createdAt: new Date().toISOString(),
      thumbnailUrl,
      previewMetadata
    };

    const updatedAttachments = [...(clip.attachments || []), newAttachment];
    handleUpdateField({ attachments: updatedAttachments });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    if (confirm("Are you sure you want to permanently delete this attachment?")) {
      try {
        await deleteAttachment(attachmentId);
        const updatedAttachments = (clip.attachments || []).filter(a => a.id !== attachmentId);
        handleUpdateField({ attachments: updatedAttachments });
      } catch (err) {
        console.error("Failed to delete attachment:", err);
      }
    }
  };

  const handleAttachmentDownload = async (attachment: NoteAttachment) => {
    try {
      const fileData = await getAttachment(attachment.id);
      if (!fileData) {
        alert("Could not locate local attachment file in storage.");
        return;
      }
      const blob = fileData.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download attachment:", err);
      alert("Error fetching attachment file.");
    }
  };

  const handleUpdateField = (updates: Partial<Clip>) => {
    const updated = { ...clip, ...updates, modifiedTimestamp: Date.now() };
    onUpdate(updated);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    handleUpdateField({ title: val });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    handleUpdateField({ content: val });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newContent = before + variable + after;
      setContent(newContent);
      handleUpdateField({ content: newContent });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      const newContent = content + variable;
      setContent(newContent);
      handleUpdateField({ content: newContent });
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFolderId(val);
    handleUpdateField({ folderId: val });
  };

  const handleKitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTagValue = e.target.value;
    setActiveKitTag(newTagValue);
    
    // Filter out old kit tags
    let updatedTags = tags.filter(t => !snippetKits.some(k => k.tag.toLowerCase() === t.toLowerCase()));
    
    if (newTagValue) {
      updatedTags = [...updatedTags, newTagValue];
    }
    
    setTags(updatedTags);
    handleUpdateField({ tags: updatedTags });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      const nextTags = [...tags, clean];
      setTags(nextTags);
      setNewTag('');
      handleUpdateField({ tags: nextTags });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter(t => t !== tagToRemove);
    setTags(nextTags);
    handleUpdateField({ tags: nextTags });
  };

  const handleAIAction = async () => {
    setIsAnalyzing(true);
    try {
      let analysis;
      if (clip.type === ClipType.IMAGE && clip.metadata?.imageSrc) {
        analysis = await analyzeImage(clip.metadata.imageSrc);
      } else {
        analysis = await analyzeContent(content, clip.type);
      }
      onUpdate({ ...clip, aiAnalysis: analysis });
    } catch (error: any) {
      alert(error.message || "Failed to analyze content. Please verify your Gemini API key configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Attributes Calculations
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.split('\n').length;
  const approxSize = `${(new Blob([content]).size / 1024).toFixed(2)} KB`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
      <div className={`${theme.modalBg} border ${theme.border} rounded-none md:rounded-2xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden`}>
        
        {/* Modal Header */}
        <div className={`p-4 border-b ${theme.border} flex items-center justify-between ${theme.sidebarBg}`}>
          <div className="flex items-center gap-3 flex-1 mr-4">
             <div className={`p-2 bg-slate-500/10 rounded-xl flex-shrink-0 ${theme.accentText}`}>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
               </svg>
             </div>
             <input
               type="text"
               value={title}
               onChange={handleTitleChange}
               className={`text-lg font-bold bg-transparent border-none outline-none focus:ring-0 w-full p-0 ${theme.text}`}
               placeholder="Untitled note"
             />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle Favorite */}
            {!clip.isDeleted && (
              <button 
                onClick={() => handleUpdateField({ isFavorite: !clip.isFavorite })}
                title="Toggle Favorite"
                className={`p-2 rounded-lg hover:bg-slate-500/10 transition-all ${
                  clip.isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-5.5 h-5.5" fill={clip.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}

            {/* Run Gemini Analysis */}
            <button 
              onClick={handleAIAction}
              disabled={isAnalyzing}
              title="Re-analyze with Gemini"
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-500/10 transition-colors disabled:opacity-40"
            >
              <svg className={`w-5.5 h-5.5 ${isAnalyzing ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </button>

            {/* Recycle / Delete actions */}
            {clip.isDeleted ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onRestore(clip.id);
                    onClose();
                  }}
                  title="Restore note"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                >
                  Restore
                </button>
                <button
                  onClick={() => {
                    if (confirm("Permanently delete this note? This cannot be undone.")) {
                      onDeletePermanently(clip.id);
                      onClose();
                    }
                  }}
                  title="Delete permanently"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                >
                  Delete Forever
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onDelete(clip.id);
                  onClose();
                }}
                title="Send to Recycle Bin"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-500/10 transition-colors"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Copy button */}
            {!clip.isDeleted && (
              <button
                onClick={() => {
                  if (onCopy) {
                    onCopy({ ...clip, title, content });
                  } else {
                    navigator.clipboard.writeText(content);
                    window.dispatchEvent(new CustomEvent('qlipto_toast', {
                      detail: { message: 'Copied to clipboard ✅', type: 'success' }
                    }));
                  }
                }}
                title="Copy note snippet"
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-500/10 transition-colors"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            )}

            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-500/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content columns */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Main content pane */}
          <div className={`flex-1 overflow-y-auto p-6 flex flex-col ${theme.bg}`}>
            
            {/* Note Metadata Banner */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/10 pb-3">
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Note Details</p>
                  <div className="text-slate-400 text-xs font-semibold flex flex-wrap gap-2 items-center">
                    <span>Type: <span className="uppercase text-amber-500 font-bold">{clip.type}</span></span>
                    <span>•</span>
                    <span>Created: {new Date(clip.timestamp).toLocaleString()}</span>
                  </div>
               </div>

               {/* Folder Selector Dropdown */}
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Folder</span>
                 <select
                   value={folderId}
                   onChange={handleFolderChange}
                   className={`text-xs font-bold px-2.5 py-1.5 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl outline-none focus:ring-1 focus:ring-amber-500 transition-all`}
                 >
                   {folders.map(f => (
                     <option key={f.id} value={f.id}>{f.name}</option>
                   ))}
                 </select>
               </div>

               {/* Snippet Kit Selector Dropdown */}
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Snippet Kit</span>
                 <select
                   value={activeKitTag}
                   onChange={handleKitChange}
                   className={`text-xs font-bold px-2.5 py-1.5 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl outline-none focus:ring-1 focus:ring-amber-500 transition-all`}
                 >
                   <option value="">None (Unassigned)</option>
                   {snippetKits.map(kit => (
                     <option key={kit.id} value={kit.tag}>{kit.name}</option>
                   ))}
                 </select>
               </div>
            </div>

            {/* Note Content Input */}
            <div className="flex-1 min-h-[300px] flex flex-col">
              {/* Snippet Variable Shortcuts Bar */}
              {!clip.isDeleted && clip.type !== ClipType.IMAGE && (
                <div className="mb-3 flex flex-wrap gap-2 items-center bg-slate-500/5 p-2 rounded-xl border border-slate-700/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-1">Shortcuts:</span>
                  <button
                    type="button"
                    onClick={() => insertVariable('{{date}}')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1 transition-all"
                    title="Insert dynamic current date"
                  >
                    <span>📅 Date</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const varName = prompt("Enter custom blank label (e.g. User_Name, Invoice_Num):", "Label");
                      if (varName) {
                        const formatted = varName.trim().replace(/\s+/g, '_');
                        insertVariable(`{{blank:${formatted}}}`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 transition-all"
                    title="Insert custom manual fill-in blank"
                  >
                    <span>✏️ Manual Blank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const promptName = prompt("Enter reusable prompt segment (e.g. translate_to_spanish, optimize_code):", "Prompt_Goal");
                      if (promptName) {
                        const formatted = promptName.trim().replace(/\s+/g, '_');
                        insertVariable(`{{ai_prompt:${formatted}}}`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 text-[10px] font-bold flex items-center gap-1 transition-all"
                    title="Insert reusable AI instructions segment"
                  >
                    <span>🧠 AI Prompt Segment</span>
                  </button>
                </div>
              )}
              {clip.type === ClipType.IMAGE && clip.metadata?.imageSrc ? (
                <div className="w-full flex-1 min-h-[350px] flex items-center justify-center bg-slate-950/20 rounded-2xl border border-slate-700/15 overflow-hidden p-4 mb-4">
                  <img src={clip.metadata.imageSrc} referrerPolicy="no-referrer" className="max-h-[400px] max-w-full object-contain rounded-lg shadow-lg" alt={clip.title} />
                </div>
              ) : (
                <textarea 
                  className={`w-full flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-base leading-relaxed ${clip.type === ClipType.CODE ? 'font-mono text-sm text-slate-200 bg-slate-500/5 p-4 rounded-xl border border-slate-500/5' : `${theme.text}`}`}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Note content is empty. Type anything to compose..."
                />
              )}
            </div>

            {/* Editable Tags section */}
            <div className="mt-4 pt-3 border-t border-slate-700/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Note Tags</p>
              <div className="flex flex-wrap gap-1.5 items-center">
                {tags.map(t => (
                  <span key={t} className="bg-slate-500/10 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <span>#{t}</span>
                    <button 
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-500 hover:text-rose-400 font-bold text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                
                {/* Form to add tag */}
                <form onSubmit={handleAddTag} className="inline-block">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="+ Add Tag"
                    className={`text-xs px-2.5 py-1 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-lg outline-none focus:ring-1 focus:ring-amber-500 transition-all font-bold w-24`}
                  />
                </form>
              </div>
            </div>
          </div>

          {/* AI Insights Pane */}
          <div className={`w-full md:w-96 ${theme.modalBg} border-t md:border-t-0 md:border-l ${theme.border} p-6 flex flex-col overflow-y-auto`}>
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800/20 pb-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/10 ${theme.accentText}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`font-bold tracking-tight text-sm uppercase ${theme.text}`}>Gemini Intel</h3>
            </div>

            {clip.aiAnalysis ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                <section className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">AI Summary</label>
                  <p className={`text-xs p-3 bg-slate-500/5 border border-slate-700/10 rounded-xl leading-relaxed font-medium ${theme.text}`}>
                    {clip.aiAnalysis.summary}
                  </p>
                </section>
                
                <section className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Core Category Tag</label>
                  <span className={`inline-block px-3 py-1 bg-amber-500/10 ${theme.accentText} rounded-lg text-xs font-black tracking-wide uppercase`}>
                    {clip.aiAnalysis.category}
                  </span>
                </section>

                <section className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Key Insights</label>
                  <ul className="space-y-2 pl-1">
                    {clip.aiAnalysis.keyPoints.map((point, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2.5 font-medium leading-relaxed">
                        <span className={theme.accentText + " mt-1 text-sm leading-none"}>&bull;</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {clip.aiAnalysis.explanation && (
                  <section className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Technical breakdown</label>
                    <p className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-3 leading-relaxed font-medium">
                      {clip.aiAnalysis.explanation}
                    </p>
                  </section>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                 <div className="w-14 h-14 bg-slate-500/5 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                 </div>
                 <p className="text-xs text-slate-500 mb-6 max-w-xs font-semibold leading-relaxed">
                   Unlock structured key points, summaries, and tags generated server-side using Gemini.
                 </p>
                 <button 
                  onClick={handleAIAction}
                  disabled={isAnalyzing}
                  className={`w-full py-3 ${theme.accentBg} ${theme.accentHover} text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2`}
                 >
                   {isAnalyzing ? (
                     <>
                       <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                       </svg> 
                       <span>Analyzing...</span>
                     </>
                   ) : (
                     <>
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                       </svg>
                       <span>Analyze with AI</span>
                     </>
                   )}
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Bottom Tabs */}
        <div className={`p-2 border-t ${theme.border} flex items-center justify-start gap-6 ${theme.sidebarBg} px-6 overflow-x-auto shrink-0`}>
          <button 
            onClick={() => setActiveTab('general')}
            className={`py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'general' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('attributes')}
            className={`py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'attributes' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Attributes
          </button>
          <button 
            onClick={() => setActiveTab('attachments')}
            className={`py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'attachments' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Attachments
          </button>
          <button 
            onClick={() => setActiveTab('sharing')}
            className={`py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'sharing' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Sharing
          </button>
        </div>

        {/* Dynamic Tab Panel content */}
        <div className={`px-6 py-4 border-t ${theme.border} ${theme.sidebarBg} text-xs ${theme.textMuted} ${activeTab === 'attachments' ? 'h-80 overflow-y-auto' : 'shrink-0'}`}>
          {activeTab === 'general' && (
            <p className="font-semibold leading-relaxed">
              Composition of basic variables. Type inside the text and title fields above to continuously auto-save note revisions.
            </p>
          )}
          {activeTab === 'attributes' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono py-1">
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Characters</span>
                <span className={`text-sm font-bold ${theme.text}`}>{charCount}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Words</span>
                <span className={`text-sm font-bold ${theme.text}`}>{wordCount}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Lines</span>
                <span className={`text-sm font-bold ${theme.text}`}>{lineCount}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Approx. Size</span>
                <span className={`text-sm font-bold ${theme.text}`}>{approxSize}</span>
              </div>
            </div>
          )}
          {activeTab === 'attachments' && (
            <div className="space-y-4 py-1">
              {/* Header Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black ${theme.text}`}>
                    📎 {clip.attachments?.length || 0} Attached Files
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">(Max 300 MB per file)</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    📁 Upload File
                  </button>
                  <button
                    onClick={() => setActiveCaptureMode('photo')}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    title="Take Photo"
                  >
                    📷 Photo
                  </button>
                  <button
                    onClick={() => setActiveCaptureMode('video')}
                    className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    title="Record Video"
                  >
                    🎥 Video
                  </button>
                  <button
                    onClick={() => setActiveCaptureMode('audio')}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    title="Record Audio"
                  >
                    🎙️ Audio
                  </button>
                  <button
                    onClick={() => setActiveCaptureMode('barcode')}
                    className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-black rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    title="Scan Barcode / QR"
                  >
                    🔍 Scan
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Attachments List */}
              {(!clip.attachments || clip.attachments.length === 0) ? (
                <div className="text-center py-6 space-y-1.5 border border-dashed border-slate-700/50 rounded-xl">
                  <p className="text-slate-400 font-semibold text-xs">No attachments found in this note.</p>
                  <p className="text-slate-500 text-[10px]">Use the actions above to link offline-first assets or scan barcodes!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                  {clip.attachments.map((attachment) => {
                    const resolvedUrl = resolvedUris[attachment.id];

                    return (
                      <div 
                        key={attachment.id} 
                        className={`flex items-start gap-3 p-3 rounded-xl border ${theme.border} bg-slate-900/30 hover:bg-slate-900/50 transition-all group relative`}
                      >
                        {/* Left Column: Preview / Thumbnail */}
                        <div className="w-12 h-12 bg-slate-800/40 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-800 relative">
                          {attachment.type === 'image' && (attachment.thumbnailUrl || resolvedUrl) ? (
                            <img 
                              src={attachment.thumbnailUrl || resolvedUrl} 
                              alt={attachment.fileName} 
                              className="w-full h-full object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                          ) : attachment.type === 'video' && resolvedUrl ? (
                            <div className="w-full h-full relative">
                              <video 
                                src={resolvedUrl} 
                                className="w-full h-full object-cover rounded" 
                                muted 
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-[10px]">▶️</span>
                              </div>
                            </div>
                          ) : attachment.type === 'audio' ? (
                            <span className="text-lg">🎙️</span>
                          ) : attachment.type === 'pdf' ? (
                            <div className="flex flex-col items-center justify-center text-rose-400">
                              <span className="text-[10px] font-black uppercase">PDF</span>
                            </div>
                          ) : (
                            <span className="text-lg">📁</span>
                          )}
                        </div>

                        {/* Middle Column: Details */}
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`font-bold text-xs truncate ${theme.text}`} title={attachment.fileName}>
                            {attachment.fileName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mt-0.5 font-semibold">
                            <span className="uppercase text-amber-500">{attachment.type}</span>
                            <span>•</span>
                            <span>{formatSize(attachment.sizeBytes)}</span>
                          </div>
                          
                          {/* Audio Player Inline */}
                          {attachment.type === 'audio' && resolvedUrl && (
                            <div className="mt-1 origin-left">
                              <audio src={resolvedUrl} controls className="h-5 w-full max-w-[150px]" />
                            </div>
                          )}
                        </div>

                        {/* Right Column: Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAttachmentDownload(attachment)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Download / View"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAttachmentDelete(attachment.id)}
                            className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Attachment"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'sharing' && (
            <div className="flex items-center justify-between font-semibold py-1 flex-wrap gap-2">
              <span>Local note sharing link: <code className="bg-slate-500/10 px-1.5 py-0.5 rounded font-mono text-amber-400">clipto://notes/{clip.id}</code></span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`clipto://notes/${clip.id}`);
                  alert("Local note URI link copied to clipboard!");
                }}
                className="text-amber-500 hover:underline text-[10px] uppercase tracking-wider font-bold"
              >
                Copy Local Link
              </button>
            </div>
          )}
        </div>
      </div>

      {activeCaptureMode && (
        <MediaCaptureModal
          mode={activeCaptureMode}
          onClose={() => setActiveCaptureMode(null)}
          theme={theme}
          onSaveAttachment={async (blob, name, type, extraContent) => {
            const MAX_SIZE_BYTES = 300 * 1024 * 1024;
            if (blob.size > MAX_SIZE_BYTES) {
              window.dispatchEvent(new CustomEvent('qlipto_toast', {
                detail: { message: 'File exceeds 300 MB limit 🚫', type: 'error' }
              }));
              window.dispatchEvent(new CustomEvent('qlipto_sys_notification', {
                detail: {
                  id: 'sys-large-file-' + Date.now(),
                  title: 'File too large.',
                  description: `Captured media exceeds the maximum limit of 300 MB.`,
                  status: 'warning'
                }
              }));
              return;
            }

            const attachmentId = 'attach-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
            
            const attachmentFile = {
              id: attachmentId,
              name,
              size: blob.size,
              type,
              data: blob,
              timestamp: Date.now()
            };
            await saveAttachment(attachmentFile);

            const attachmentType = getAttachmentType(type, name);
            const { thumbnailUrl, previewMetadata } = await generatePreviewMetadataAndThumbnail(blob, attachmentType);

            const newAttachment: NoteAttachment = {
              id: attachmentId,
              noteId: clip.id,
              type: attachmentType,
              fileName: name,
              mimeType: type,
              sizeBytes: blob.size,
              localUri: `indexeddb://${attachmentId}`,
              createdAt: new Date().toISOString(),
              thumbnailUrl,
              previewMetadata
            };

            const updatedAttachments = [...(clip.attachments || []), newAttachment];
            
            let newContent = content;
            if (extraContent) {
              newContent = content ? `${content}\n\n[Scanned Barcode: ${extraContent}]` : extraContent;
              setContent(newContent);
            }

            handleUpdateField({ 
              attachments: updatedAttachments,
              content: newContent
            });
            setActiveCaptureMode(null);
          }}
        />
      )}
    </div>
  );
};

export default ClipDetailsModal;
