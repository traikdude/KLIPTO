import React, { useState, useRef } from 'react';
import { ClipType } from '../types';
import { Theme } from '../theme';

interface NewClipModalProps {
  onClose: () => void;
  onSave: (title: string, content: string, type: ClipType, imageSrc?: string, tagToAssign?: string) => void;
  theme: Theme;
  defaultType?: ClipType;
  snippetKits: { id: string; name: string; tag: string; color: string }[];
}

const NewClipModal: React.FC<NewClipModalProps> = ({ onClose, onSave, theme, defaultType, snippetKits }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ClipType>(defaultType || ClipType.TEXT);
  const [selectedKitTag, setSelectedKitTag] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setType(ClipType.IMAGE);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onSave(title, content, type, imagePreview || undefined, selectedKitTag || undefined);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className={`${theme.modalBg} border ${theme.border} rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-8 md:zoom-in duration-200 max-h-[95vh] flex flex-col`}>
        <div className={`px-6 py-4 border-b ${theme.border} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${theme.text}`}>Create New Snippet</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2.5 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-semibold`}
              placeholder="e.g. FastAPI Router Example"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Snippet Type</label>
            <div className="flex gap-2">
              {[ClipType.TEXT, ClipType.CODE, ClipType.IMAGE].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${
                    type === t 
                      ? `${theme.accentBg} text-black border-transparent shadow-md font-bold` 
                      : `bg-slate-500/5 ${theme.text} ${theme.border} hover:bg-slate-500/10`
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {type === ClipType.IMAGE ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Image Content</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-40 md:h-48 border-2 border-dashed ${theme.border} rounded-xl bg-slate-500/5 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-all overflow-hidden`}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <svg className="w-9 h-9 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-500">Tap to upload image</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Content</label>
              <textarea 
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full px-4 py-3 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm leading-relaxed font-medium ${
                  type === ClipType.CODE ? 'font-mono text-xs' : ''
                }`}
                placeholder={type === ClipType.CODE ? "Paste code snippet here..." : "Write down some ideas..."}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Assign to Snippet Kit</label>
            <select
              value={selectedKitTag}
              onChange={(e) => setSelectedKitTag(e.target.value)}
              className={`w-full px-4 py-2.5 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-semibold`}
            >
              <option value="">None (Unassigned)</option>
              {snippetKits.map(kit => (
                <option key={kit.id} value={kit.tag}>{kit.name} (Adds tag: #{kit.tag})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button 
              type="button"
              onClick={onClose}
              className={`w-full sm:flex-1 py-3 ${theme.text} font-bold rounded-xl bg-slate-500/5 hover:bg-slate-500/10 transition-colors order-2 sm:order-1`}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`w-full sm:flex-1 py-3 ${theme.accentBg} ${theme.accentHover} text-black font-bold rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all order-1 sm:order-2`}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewClipModal;
