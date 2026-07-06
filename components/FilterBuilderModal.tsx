import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Filter, Info, ChevronDown, Check, Tag, Folder, Calendar, HelpCircle } from 'lucide-react';
import { Theme } from '../theme';
import { ClipType } from '../types';

interface FilterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  folders: { id: string; name: string }[];
  tags: string[];
  onSaveFilter: (name: string, query: string, rules: any) => void;
}

export function FilterBuilderModal({
  isOpen,
  onClose,
  theme,
  folders,
  tags,
  onSaveFilter
}: FilterBuilderModalProps) {
  const [filterName, setFilterName] = useState('');
  const [contentQuery, setContentQuery] = useState('');
  const [noteType, setNoteType] = useState<'all' | ClipType>('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [lengthRule, setLengthRule] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [minUsageCount, setMinUsageCount] = useState<number>(0);
  const [showDifferenceInfo, setShowDifferenceInfo] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim()) {
      alert('Please provide a name for your saved filter.');
      return;
    }

    // Prepare compound query rules
    const rules = {
      tag: selectedTag,
      folderId: selectedFolder,
      dateRange,
      lengthRule,
      minUsageCount: minUsageCount > 0 ? minUsageCount : undefined,
      contentQuery: contentQuery.trim() || undefined,
      noteType: noteType !== 'all' ? noteType : undefined
    };

    // query is the default fallback text representation
    const fallbackQuery = contentQuery.trim() || selectedTag !== 'all' ? selectedTag : 'Compound Query';

    onSaveFilter(filterName.trim(), fallbackQuery, rules);
    
    // Reset state
    setFilterName('');
    setContentQuery('');
    setNoteType('all');
    setSelectedTag('all');
    setSelectedFolder('all');
    setDateRange('all');
    setLengthRule('all');
    setMinUsageCount(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-xl rounded-2xl border ${theme.border} ${theme.modalBg} flex flex-col max-h-[90vh] shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`p-5 border-b ${theme.border} flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-extrabold text-base ${theme.text} tracking-tight`}>
                🔎 Compound Filter Builder
              </h2>
              <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                Design multi-rule queries to instantly scan and group notes.
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

        {/* Info Banner Explaining differences */}
        {showDifferenceInfo && (
          <div className="mx-5 mt-4 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 text-xs animate-in slide-in-from-top-1 duration-200">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-blue-300 flex items-center justify-between">
                <span>How Filters Differ from Tags & Folders</span>
                <button 
                  onClick={() => setShowDifferenceInfo(false)}
                  className="text-blue-500 hover:text-blue-300 text-[10px] uppercase font-bold"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Unlike <strong>Folders</strong> (which strictly group notes into one category) and <strong>Tags</strong> (which are manually assigned, static labels), <strong>Filters</strong> are dynamic, saved queries. They run in the background and match notes automatically whenever their content, usage count, tag list, or date parameters change.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Name & Content Query */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <span>Filter Label / Name</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Active JS Snippets"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border ${theme.border} bg-black/20 text-slate-100 outline-none focus:ring-1 focus:ring-rose-500 font-semibold`}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Text/Content Query
              </label>
              <input
                type="text"
                placeholder="e.g., function, export"
                value={contentQuery}
                onChange={(e) => setContentQuery(e.target.value)}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border ${theme.border} bg-black/20 text-slate-100 outline-none focus:ring-1 focus:ring-rose-500 font-semibold`}
              />
            </div>
          </div>

          {/* Tag & Folder Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Tag Match Rule</span>
              </label>
              <div className="relative">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border ${theme.border} bg-[#1a1a1a] text-slate-100 outline-none appearance-none font-semibold cursor-pointer pr-10`}
                >
                  <option value="all">Any Tag (No tag constraint)</option>
                  <option value="none">Untagged Notes only</option>
                  {tags.map((tag) => (
                    <option key={tag} value={tag}>Has Tag: #{tag.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Folder className="w-3 h-3" />
                <span>Folder Match Rule</span>
              </label>
              <div className="relative">
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border ${theme.border} bg-[#1a1a1a] text-slate-100 outline-none appearance-none font-semibold cursor-pointer pr-10`}
                >
                  <option value="all">Any Folder (No folder constraint)</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>In Folder: {folder.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Note Type & Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Note Media Type
              </label>
              <div className="flex bg-black/25 p-1 rounded-xl border border-slate-800">
                {(['all', ClipType.TEXT, ClipType.CODE, ClipType.IMAGE] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNoteType(type)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      noteType === type
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Creation Date Range</span>
              </label>
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border ${theme.border} bg-[#1a1a1a] text-slate-100 outline-none appearance-none font-semibold cursor-pointer pr-10`}
                >
                  <option value="all">Any Time (No date constraint)</option>
                  <option value="today">Created in Last 24 Hours</option>
                  <option value="week">Created in Last 7 Days</option>
                  <option value="month">Created in Last 30 Days</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Length Rule & Min Usage Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Character Length Rule
              </label>
              <div className="relative">
                <select
                  value={lengthRule}
                  onChange={(e) => setLengthRule(e.target.value as any)}
                  className={`w-full text-xs px-3 py-2.5 rounded-xl border ${theme.border} bg-[#1a1a1a] text-slate-100 outline-none appearance-none font-semibold cursor-pointer pr-10`}
                >
                  <option value="all">Any Length (No length constraint)</option>
                  <option value="short">Short Snippet (≤ 50 characters)</option>
                  <option value="medium">Medium Content (51 - 500 characters)</option>
                  <option value="long">Long document (&gt; 500 characters)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Minimum Usage Count (Copies)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={minUsageCount || ''}
                onChange={(e) => setMinUsageCount(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full text-xs px-3 py-2.5 rounded-xl border ${theme.border} bg-black/20 text-slate-100 outline-none focus:ring-1 focus:ring-rose-500 font-semibold`}
              />
            </div>
          </div>

          {/* Preview Panel showing live query syntax */}
          <div className={`p-4 rounded-xl border ${theme.border} bg-black/30 space-y-2`}>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <span>SQL-like Compound Expression Preview</span>
            </div>
            <div className="font-mono text-[10px] text-rose-400/90 break-all leading-normal bg-black/40 p-2.5 rounded-lg border border-slate-900">
              SELECT * FROM notes WHERE isDeleted = false 
              {noteType !== 'all' && ` AND type = '${noteType}'`}
              {selectedTag !== 'all' && ` AND tag = '${selectedTag}'`}
              {selectedFolder !== 'all' && ` AND folderId = '${selectedFolder}'`}
              {dateRange !== 'all' && ` AND timestamp >= DateNow() - Interval('${dateRange}')`}
              {lengthRule !== 'all' && ` AND length(content) ${lengthRule === 'short' ? '≤ 50' : lengthRule === 'medium' ? 'BETWEEN 51 AND 500' : ' > 500'}`}
              {minUsageCount > 0 && ` AND usageCount >= ${minUsageCount}`}
              {contentQuery.trim() && ` AND (title LIKE '%${contentQuery}%' OR content LIKE '%${contentQuery}%')`}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
            >
              Create Saved Filter
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
