import React, { useState, useEffect } from 'react';
import { Clip, ClipType, PREDEFINED_TAGS_MAP, TagMetadata } from '../types';
import { Theme, AppSettings } from '../theme';
import { getTranslation } from '../services/localization';

export interface SidebarDirectoryItem {
  id: string;
  label: string;
  currentCount: number;
  maxCapacityLimit: number | null;
  hasDragHandle: boolean;
}

interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenSkillRunes?: () => void;
  onOpenSettings?: () => void;
  theme: Theme;
  clips: Clip[];
  folders: { id: string; name: string }[];
  onAddFolder: (name: string) => void;
  onRemoveFolder?: (id: string) => void;
  filters: { id: string; name: string; query: string; rules?: any }[];
  onAddFilter: (name: string, query: string, rules?: any) => void;
  onRemoveFilter?: (id: string) => void;
  settings?: AppSettings;
  onAddClip?: () => void;
  onOpenPublicLibrary?: () => void;
  onOpenFilterBuilder?: () => void;
  snippetKits: { id: string; name: string; tag: string; color: string }[];
  setSnippetKits: React.Dispatch<React.SetStateAction<{ id: string; name: string; tag: string; color: string }[]>>;
}

export function renderSidebarItemText(item: SidebarDirectoryItem): string {
  if (item.maxCapacityLimit !== null) {
    return `${item.label} (${item.currentCount} / ${item.maxCapacityLimit})`;
  }
  return `${item.label} (${item.currentCount})`;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeFilter, 
  onFilterChange, 
  isOpen, 
  onClose, 
  onOpenSkillRunes,
  onOpenSettings,
  theme,
  clips,
  folders,
  onAddFolder,
  onRemoveFolder,
  filters,
  onAddFilter,
  onRemoveFilter,
  settings,
  onAddClip,
  onOpenPublicLibrary,
  onOpenFilterBuilder,
  snippetKits,
  setSnippetKits
}) => {
  // Collapsed sections (Revived if Revive is enabled)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('qlipto_collapsed_sections');
    const defaultVal = {
      'NOTES': false,
      'TAGS': false,
      'FOLDERS': false,
      'FILTERS': false,
      'SNIPPET KITS': false,
    };
    if (saved) {
      try {
        const savedSettings = localStorage.getItem('qlipto_settings');
        let reviveIsOn = true;
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.reviveEnabled !== undefined) {
            reviveIsOn = !!parsedSettings.reviveEnabled;
          }
        }
        if (reviveIsOn) {
          return JSON.parse(saved);
        }
      } catch (e) {}
    }
    return defaultVal;
  });

  // Styles and sorting state per section
  const [sectionListStyle, setSectionListStyle] = useState<Record<string, 'default' | 'grid' | 'comfortable' | 'condensed'>>(() => {
    const saved = localStorage.getItem('qlipto_section_styles');
    return saved ? JSON.parse(saved) : {
      'NOTES': 'default',
      'TAGS': 'default',
      'FOLDERS': 'default',
      'FILTERS': 'default',
      'SNIPPET KITS': 'default'
    };
  });

  const [sectionSortBy, setSectionSortBy] = useState<Record<string, 'creation' | 'editing' | 'usage' | 'length'>>(() => {
    const saved = localStorage.getItem('qlipto_section_sortby');
    return saved ? JSON.parse(saved) : {
      'NOTES': 'creation',
      'TAGS': 'creation',
      'FOLDERS': 'creation',
      'FILTERS': 'creation',
      'SNIPPET KITS': 'creation'
    };
  });

  // Custom empty/dynamic tags & snippet kits persistence
  const [customTags, setCustomTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('qlipto_custom_tags');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal / overlay trigger states
  const [activeInlineAddSection, setActiveInlineAddSection] = useState<'TAGS' | 'FOLDERS' | 'FILTERS' | 'SNIPPET KITS' | null>(null);
  const [activeEllipsisSection, setActiveEllipsisSection] = useState<string | null>(null);

  // Contextual Onboarding Tooltips state
  const [dismissedTooltips, setDismissedTooltips] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('qlipto_dismissed_tooltips');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeTooltipSection, setActiveTooltipSection] = useState<string | null>(null);

  const dismissTooltip = (sectionTitle: string) => {
    setDismissedTooltips(prev => {
      const updated = { ...prev, [sectionTitle]: true };
      localStorage.setItem('qlipto_dismissed_tooltips', JSON.stringify(updated));
      return updated;
    });
    if (activeTooltipSection === sectionTitle) {
      setActiveTooltipSection(null);
    }
  };

  const toggleTooltip = (sectionTitle: string) => {
    setActiveTooltipSection(prev => prev === sectionTitle ? null : sectionTitle);
  };

  const getTooltipDescription = (title: string): string => {
    if (title === 'NOTES') {
      return "The active list shows your synchronized clips. Built-in capacity-control restricts views up to 300 active items to maintain maximum UI and database responsiveness.";
    }
    if (title === 'TAGS') {
      return "Tags help you classify notes across multiple categories. A note can have more than one tag.";
    }
    if (title === 'FOLDERS') {
      return "Folders allow you to organize notes in a single folder hierarchy. Each note belongs to one folder.";
    }
    if (title === 'FILTERS') {
      return "Filters are dynamic compound queries that search tag, folder, date, length, and usage simultaneously. Unlike Folders (which strictly group notes in a hierarchy) and Tags (which are static labels), Filters update automatically as your database changes.";
    }
    if (title === 'SNIPPET KITS') {
      return "Snippet Kits are customized template capsules pre-bound to specific tags with custom highlight colors.";
    }
    return "";
  };

  // Form input variables for overlays
  const [newTagName, setNewTagName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterQuery, setNewFilterQuery] = useState('');
  const [newKitName, setNewKitName] = useState('');
  const [newKitTag, setNewKitTag] = useState('');
  const [newKitColor, setNewKitColor] = useState('text-rose-400');

  // Save changes to local storage
  useEffect(() => {
    if (settings?.reviveEnabled) {
      localStorage.setItem('qlipto_collapsed_sections', JSON.stringify(collapsedSections));
    }
  }, [collapsedSections, settings?.reviveEnabled]);

  useEffect(() => {
    localStorage.setItem('qlipto_section_styles', JSON.stringify(sectionListStyle));
  }, [sectionListStyle]);

  useEffect(() => {
    localStorage.setItem('qlipto_section_sortby', JSON.stringify(sectionSortBy));
  }, [sectionSortBy]);

  useEffect(() => {
    localStorage.setItem('qlipto_custom_tags', JSON.stringify(customTags));
  }, [customTags]);

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const updated = { ...prev, [title]: !prev[title] };
      if (settings?.reviveEnabled) {
        localStorage.setItem('qlipto_collapsed_sections', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const activeClips = clips.filter(c => !c.isDeleted);
  const deletedClips = clips.filter(c => !!c.isDeleted);

  // Compute tag list dynamically from non-deleted clips
  const tagCounts: Record<string, number> = {};
  activeClips.forEach(clip => {
    clip.tags.forEach(tag => {
      const clean = tag.trim().toLowerCase();
      if (clean) {
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      }
    });
  });

  const combinedTagNames = Array.from(new Set([
    'none',
    'learn',
    'search',
    'emojis',
    'font styles',
    'decorations',
    'video ai',
    ...Object.keys(tagCounts),
    ...customTags.map(t => t.toLowerCase().trim())
  ]));

  const dynamicTags = combinedTagNames.map(tag => {
    let currentCount = tagCounts[tag] || 0;
    if (tag === 'none') {
      currentCount = activeClips.filter(c => c.type === ClipType.CODE).length;
    }
    
    const isPredefined = ['none', 'learn', 'search', 'emojis', 'font styles', 'decorations', 'video ai'].includes(tag);

    return {
      id: `tag-${tag}`,
      label: tag === 'none' ? 'none' : tag.toUpperCase(),
      currentCount,
      maxCapacityLimit: null,
      hasDragHandle: !isPredefined,
      color: tag === 'code' ? 'text-indigo-400' :
             tag === 'learn' ? 'text-emerald-400' :
             tag === 'search' ? 'text-sky-400' :
             tag === 'emojis' ? 'text-yellow-400' : 'text-slate-400',
      icon: 'M7 7h.01M6 20a1 1 0 01-1-1V5a1 1 0 011-1h5l7 7-7 7H6z',
      canDelete: !isPredefined && (customTags.some(ct => ct.toLowerCase() === tag.toLowerCase()) || tagCounts[tag] !== undefined)
    };
  });

  // Compute folder counts dynamically
  const folderCounts: Record<string, number> = {};
  activeClips.forEach(clip => {
    const fId = clip.folderId || 'folder-root';
    folderCounts[fId] = (folderCounts[fId] || 0) + 1;
  });

  // Note items following SidebarDirectoryItem schema
  const currentLang = settings?.language || 'en';
  const noteItems = [
    { 
      id: 'all', 
      label: getTranslation(currentLang, 'allNotes'), 
      currentCount: activeClips.length, 
      maxCapacityLimit: 300, 
      hasDragHandle: false,
      icon: 'M18.6 8C17.12 8 15.8 8.81 15 10c-.8-1.19-2.12-2-3.6-2-2.43 0-4.4 1.97-4.4 4.4S8.97 16.8 11.4 16.8c1.48 0 2.8-.81 3.6-2 .8 1.19 2.12 2 3.6 2 2.43 0 4.4-1.97 4.4-4.4S21.03 8 18.6 8zm-7.2 6.4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.2 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z'
    },
    { 
      id: 'favorites', 
      label: getTranslation(currentLang, 'favorites'), 
      currentCount: activeClips.filter(c => c.isFavorite).length, 
      maxCapacityLimit: null, 
      hasDragHandle: false,
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' 
    },
    { 
      id: 'untagged', 
      label: getTranslation(currentLang, 'untagged'), 
      currentCount: activeClips.filter(c => c.tags.length === 0).length, 
      maxCapacityLimit: null, 
      hasDragHandle: false,
      icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
    },
    { 
      id: 'text', 
      label: getTranslation(currentLang, 'clipboard'), 
      currentCount: activeClips.filter(c => c.type === ClipType.TEXT).length, 
      maxCapacityLimit: null, 
      hasDragHandle: false,
      icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' 
    },
    { 
      id: 'code', 
      label: getTranslation(currentLang, 'snippets'), 
      currentCount: activeClips.filter(c => c.type === ClipType.CODE).length, 
      maxCapacityLimit: null, 
      hasDragHandle: false,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' 
    },
    { 
      id: 'recycle', 
      label: getTranslation(currentLang, 'recycleBin'), 
      currentCount: deletedClips.length, 
      maxCapacityLimit: 5000, 
      hasDragHandle: false,
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' 
    }
  ];

  // Quick action submit triggers
  const handleCreateTagSubmit = () => {
    const clean = newTagName.trim().toLowerCase();
    if (clean && !customTags.includes(clean)) {
      setCustomTags(prev => [...prev, clean]);
      setActiveInlineAddSection(null);
      setNewTagName('');
    }
  };

  const handleCreateFolderSubmit = () => {
    const clean = newFolderName.trim();
    if (clean) {
      onAddFolder(clean);
      setActiveInlineAddSection(null);
      setNewFolderName('');
    }
  };

  const handleCreateFilterSubmit = () => {
    const nameClean = newFilterName.trim();
    const queryClean = newFilterQuery.trim();
    if (nameClean && queryClean) {
      onAddFilter(nameClean, queryClean);
      setActiveInlineAddSection(null);
      setNewFilterName('');
      setNewFilterQuery('');
    }
  };

  const handleCreateKitSubmit = () => {
    const nameClean = newKitName.trim();
    const tagClean = newKitTag.trim().toLowerCase();
    if (nameClean && tagClean) {
      const newKit = {
        id: `kit-${Date.now()}`,
        name: nameClean,
        tag: tagClean,
        color: newKitColor
      };
      setSnippetKits(prev => [...prev, newKit]);
      setActiveInlineAddSection(null);
      setNewKitName('');
      setNewKitTag('');
      setNewKitColor('text-rose-400');
    }
  };

  // List sorting helper
  const sortSectionItems = (items: any[], sortBy: string) => {
    const copy = [...items];
    if (sortBy === 'usage') {
      return copy.sort((a, b) => (b.currentCount || 0) - (a.currentCount || 0));
    }
    if (sortBy === 'length') {
      return copy.sort((a, b) => (a.label || '').length - (b.label || '').length);
    }
    if (sortBy === 'editing') {
      return copy.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    }
    return copy; // creation (default)
  };

  // Combined Section Configuration Object
  const sections = [
    {
      title: 'NOTES',
      count: activeClips.length,
      items: noteItems,
      canAdd: true
    },
    { 
      title: 'TAGS', 
      count: dynamicTags.length, 
      items: dynamicTags,
      canAdd: true
    },
    { 
      title: 'FOLDERS', 
      count: folders.length, 
      items: folders.map(f => ({
        id: f.id,
        label: f.name,
        currentCount: folderCounts[f.id] || 0,
        maxCapacityLimit: null,
        hasDragHandle: true,
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
        canDelete: f.id !== 'folder-root'
      })),
      canAdd: true
    },
    { 
      title: 'FILTERS', 
      count: filters.length, 
      items: filters.map(f => ({
        id: `filter-${f.id}`,
        label: f.name,
        currentCount: activeClips.filter(c => {
          if (f.rules) {
            const r = f.rules;
            // Tag Match rule
            if (r.tag && r.tag !== 'all') {
              if (r.tag === 'none') {
                if (c.tags && c.tags.length > 0) return false;
              } else {
                if (!c.tags || !c.tags.some((t: string) => t.toLowerCase() === r.tag!.toLowerCase())) return false;
              }
            }
            // Folder Match rule
            if (r.folderId && r.folderId !== 'all') {
              if ((c.folderId || 'folder-root') !== r.folderId) return false;
            }
            // Date Match rule
            if (r.dateRange && r.dateRange !== 'all') {
              const diffMs = Date.now() - (c.timestamp || 0);
              if (r.dateRange === 'today' && diffMs > 24 * 3600000) return false;
              if (r.dateRange === 'week' && diffMs > 7 * 24 * 3600000) return false;
              if (r.dateRange === 'month' && diffMs > 30 * 24 * 3600000) return false;
            }
            // Length Match rule
            if (r.lengthRule && r.lengthRule !== 'all') {
              const len = (c.content || '').length;
              if (r.lengthRule === 'short' && len > 50) return false;
              if (r.lengthRule === 'medium' && (len <= 50 || len > 500)) return false;
              if (r.lengthRule === 'long' && len <= 500) return false;
            }
            // Usage Match rule
            if (r.minUsageCount !== undefined && r.minUsageCount > 0) {
              if ((c.usageCount || 0) < r.minUsageCount) return false;
            }
            // Content Match rule
            if (r.contentQuery && r.contentQuery.trim()) {
              const q = r.contentQuery.toLowerCase().trim();
              const textMatch = (c.title || '').toLowerCase().includes(q) || 
                               (c.content || '').toLowerCase().includes(q);
              if (!textMatch) return false;
            }
            // Note Type Match rule
            if (r.noteType && r.noteType !== 'all') {
              if (c.type !== r.noteType) return false;
            }
            return true;
          }
          return (c.title || '').toLowerCase().includes(f.query.toLowerCase()) || 
                 (c.content || '').toLowerCase().includes(f.query.toLowerCase());
        }).length,
        maxCapacityLimit: null,
        hasDragHandle: true,
        icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
        canDelete: true,
        rawId: f.id
      })),
      canAdd: true
    },
    { 
      title: 'SNIPPET KITS', 
      count: snippetKits.length, 
      items: snippetKits.map(kit => ({
        id: kit.id,
        label: kit.name,
        currentCount: activeClips.filter(c => c.tags.map(t => t.toLowerCase()).includes(kit.tag.toLowerCase())).length,
        maxCapacityLimit: null,
        hasDragHandle: false,
        color: kit.color,
        icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        canDelete: kit.id !== 'kit-snippetz'
      })),
      canAdd: true
    }
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 ${theme.sidebarBg} border-r ${theme.border} h-screen transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex flex-col relative overflow-hidden`}>
        
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${theme.border} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full border-2 ${theme.isDark ? 'border-[#fbc02d]' : 'border-slate-800'} flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${theme.isDark ? 'bg-[#fbc02d]' : 'bg-slate-800'}`}></div>
            </div>
            <span className={`font-bold text-sm uppercase tracking-tighter ${theme.text}`}>Clipto AI</span>
          </div>
          <button 
            onClick={onOpenSettings} 
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-500/10"
            title="Application Settings"
          >
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>

        {/* Scroller / Accordion Sections */}
        <div className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => {
            const isCollapsed = collapsedSections[section.title];
            const listStyle = sectionListStyle[section.title] || 'default';
            const sortBy = sectionSortBy[section.title] || 'creation';
            const sortedItems = sortSectionItems(section.items, sortBy);
            const isGrid = listStyle === 'grid';

            return (
              <div key={section.title} className="mb-2 relative">
                
                {/* 4.1 Accordion Header Structure */}
                <div 
                  onClick={() => toggleSection(section.title)}
                  className="px-4 py-2 flex items-center justify-between group cursor-pointer hover:bg-slate-500/5 rounded-lg mx-1"
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-[10px] text-slate-500 font-bold transition-transform duration-150 inline-block ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    >
                      ∨
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {section.title === 'NOTES' ? getTranslation(currentLang, 'sidebarNotes') :
                       section.title === 'TAGS' ? getTranslation(currentLang, 'sidebarTags') :
                       section.title === 'FOLDERS' ? getTranslation(currentLang, 'sidebarFolders') :
                       section.title === 'FILTERS' ? getTranslation(currentLang, 'sidebarFilters') :
                       section.title === 'SNIPPET KITS' ? getTranslation(currentLang, 'sidebarSnippetKits') :
                       section.title} ({section.count})
                    </span>

                    {/* Onboarding Info Icon Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTooltip(section.title);
                      }}
                      className="p-1 text-slate-500 hover:text-amber-500 rounded-md transition-colors flex items-center justify-center"
                      title={`Show onboarding help for ${section.title.toLowerCase()}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Inline action controllers */}
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {/* Inline Plus Button */}
                    {section.canAdd && (
                      <button
                        onClick={() => {
                          if (section.title === 'NOTES') {
                            if (onAddClip) onAddClip();
                          } else if (section.title === 'FILTERS' && onOpenFilterBuilder) {
                            onOpenFilterBuilder();
                          } else {
                            setActiveInlineAddSection(section.title as any);
                          }
                        }}
                        title={section.title === 'NOTES' ? "Create New Note" : `Create new ${section.title.toLowerCase()}`}
                        className="p-1 rounded hover:bg-slate-500/10 text-amber-500 hover:text-amber-400 transition-all flex items-center justify-center font-bold text-xs"
                      >
                        [+]
                      </button>
                    )}
                    
                    {/* Inline Ellipsis Button */}
                    <button
                      onClick={() => setActiveEllipsisSection(section.title)}
                      title={`Style & Sort ${section.title.toLowerCase()}`}
                      className="p-1 rounded hover:bg-slate-500/10 text-slate-500 hover:text-slate-100 transition-all flex items-center justify-center font-bold text-xs"
                    >
                      [...]
                    </button>
                  </div>
                </div>

                {/* Contextual Onboarding Tooltip Overlay */}
                {(!dismissedTooltips[section.title] || activeTooltipSection === section.title) && (
                  <div className="absolute top-[38px] left-4 right-4 bg-[#fef08a] text-amber-950 p-3.5 rounded-xl border border-amber-300/40 z-30 shadow-xl flex flex-col gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Small pointer/anchor */}
                    <div className="absolute top-[-5px] left-[115px] w-2.5 h-2.5 bg-[#fef08a] rotate-45 border-t border-l border-amber-300/40" />
                    
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="leading-relaxed select-text text-[11px] font-bold text-slate-950 flex-1">
                        {getTooltipDescription(section.title)}
                      </p>
                      <span className="text-[10px] font-black opacity-40 font-mono select-none">Help</span>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissTooltip(section.title);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg tracking-wider transition-all shadow-sm uppercase active:scale-95"
                      >
                        GOT IT!
                      </button>
                    </div>
                  </div>
                )}

                {/* Section Content Block */}
                {!isCollapsed && (
                  <div className={isGrid ? "flex flex-wrap gap-1.5 px-4 py-2 animate-in fade-in duration-150" : "flex flex-col mt-0.5 animate-in fade-in duration-150"}>
                    {sortedItems.map((item) => {
                      const isActive = activeFilter === item.id;
                      
                      const paddingClass = listStyle === 'condensed' 
                        ? 'py-0.5 px-4' 
                        : listStyle === 'comfortable' 
                          ? 'py-2.5 px-4' 
                          : 'py-1.5 px-4'; // default padding

                      // 5. 🏷️ Tag Row Inventory rendering
                      if (section.title === 'TAGS') {
                        const tagKey = item.label.toLowerCase();
                        const meta = PREDEFINED_TAGS_MAP[tagKey];
                        const emoji = meta?.emoji || '';
                        const colorClass = meta?.colorClass || 'text-slate-400';
                        const bgIndicatorClass = meta?.bgIndicatorClass || 'bg-slate-400';
                        const outcomeDesc = meta?.outcomeDesc || 'Filters notes containing tag';

                        if (isGrid) {
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                onFilterChange(item.id);
                                if (onClose) onClose();
                              }} 
                              title={outcomeDesc}
                              className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-all rounded-lg text-xs font-semibold relative group/item border ${
                                isActive 
                                  ? `${theme.inputBg} ${theme.text} border-slate-500/40 shadow-sm font-extrabold` 
                                  : `bg-slate-800/10 text-slate-400 hover:bg-slate-500/10 hover:${theme.text} border-transparent`
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${bgIndicatorClass} flex-shrink-0`} />
                              
                              <span className={`text-[11px] truncate max-w-[110px] flex items-center gap-1 ${colorClass}`}>
                                {emoji && <span className="text-xs">{emoji}</span>}
                                <span>{item.label} ({item.currentCount})</span>
                              </span>

                              {/* Grid Delete context button */}
                              {item.canDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete this?`)) {
                                      setCustomTags(prev => prev.filter(t => t.toLowerCase() !== item.label.toLowerCase()));
                                    }
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all text-[8px] font-black hover:scale-115"
                                  title="Delete Item"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              onFilterChange(item.id);
                              if (onClose) onClose();
                            }} 
                            title={outcomeDesc}
                            className={`flex items-center justify-between cursor-pointer transition-all group/item ${paddingClass} ${
                              isActive 
                                ? `${theme.inputBg} ${theme.text} font-bold rounded-lg mx-2` 
                                : `text-slate-400 hover:bg-slate-500/5 hover:${theme.text}`
                            }`}
                          >
                            <div className="flex items-center gap-3 pl-2 truncate flex-1">
                              {/* Colored Tag Indicator */}
                              <span className={`w-2.5 h-2.5 rounded-full ${bgIndicatorClass} flex-shrink-0`} />
                              
                              {/* Tag Label with Optional Emoji */}
                              <span className={`text-[12px] font-semibold truncate flex items-center gap-1.5 ${colorClass}`}>
                                {emoji && <span className="text-sm">{emoji}</span>}
                                <span>{item.label}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Count */}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-500/10 text-slate-500 group-hover/item:text-slate-300 transition-colors ${isActive ? 'bg-amber-500/20 text-amber-500 font-extrabold' : ''}`}>
                                {item.currentCount}
                              </span>

                              {/* Context Menu / Trash icon */}
                              {item.canDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete this?`)) {
                                      setCustomTags(prev => prev.filter(t => t.toLowerCase() !== item.label.toLowerCase()));
                                    }
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded transition-all"
                                  title="Delete Tag"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Render grid tile/card layouts
                      if (isGrid) {
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              onFilterChange(item.id);
                              if (onClose) onClose();
                            }} 
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer transition-all rounded-lg text-xs font-semibold relative group/item border ${
                              isActive 
                                ? `${theme.inputBg} ${theme.text} border-slate-500/40 shadow-sm font-extrabold` 
                                : `bg-slate-800/10 text-slate-400 hover:bg-slate-500/10 hover:${theme.text} border-transparent`
                            }`}
                          >
                            {item.icon && item.icon.length > 2 ? (
                              <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? theme.accentText : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon} />
                              </svg>
                            ) : (
                              <span className="w-3.5 text-center text-[10px] flex-shrink-0">{item.icon || '#'}</span>
                            )}
                            <span className={`text-[11px] truncate max-w-[110px] ${item.color || ''}`}>
                              {renderSidebarItemText(item as SidebarDirectoryItem)}
                            </span>

                            {/* Grid Delete context button */}
                            {((item as any).canDelete && (onRemoveFolder || onRemoveFilter)) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete this?`)) {
                                    if (section.title === 'FOLDERS' && onRemoveFolder) {
                                      onRemoveFolder(item.id);
                                    } else if (section.title === 'FILTERS' && onRemoveFilter && (item as any).rawId) {
                                      onRemoveFilter((item as any).rawId);
                                    } else if (section.title === 'SNIPPET KITS') {
                                      setSnippetKits(prev => prev.filter(sk => sk.id !== item.id));
                                    }
                                  }
                                }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all text-[8px] font-black hover:scale-115"
                                title="Delete Item"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            onFilterChange(item.id);
                            if (onClose) onClose();
                          }} 
                          className={`flex items-center justify-between cursor-pointer transition-all group/item ${paddingClass} ${
                            isActive 
                              ? `${theme.inputBg} ${theme.text} font-bold rounded-lg mx-2` 
                              : `text-slate-400 hover:bg-slate-500/5 hover:${theme.text}`
                          }`}
                        >
                          <div className="flex items-center gap-3 pl-2 truncate flex-1">
                            {/* Drag Handle Indicator */}
                            {item.hasDragHandle && (
                              <span 
                                className="text-slate-600 font-mono text-[10px] tracking-tighter opacity-30 group-hover/item:opacity-80 transition-opacity cursor-grab flex-shrink-0"
                                title="Drag to reorder"
                              >
                                ⋮⋮
                              </span>
                            )}
                            
                            {item.icon && item.icon.length > 2 ? (
                              <svg className={`w-4 h-4 flex-shrink-0 ${isActive ? theme.accentText : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                              </svg>
                            ) : (
                              <span className="w-4 text-center text-xs flex-shrink-0">{item.icon || '#'}</span>
                            )}
                            <span className={`text-[12px] font-semibold truncate ${item.color || ''}`}>
                              {renderSidebarItemText(item as SidebarDirectoryItem)}
                            </span>
                          </div>
                          
                          {/* Context Menu Action (Trash icon or delete button for Folder/Filter/Tags/Kits) */}
                          {((item as any).canDelete) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete this?`)) {
                                  if (section.title === 'FOLDERS' && onRemoveFolder) {
                                    onRemoveFolder(item.id);
                                  } else if (section.title === 'FILTERS' && onRemoveFilter && (item as any).rawId) {
                                    onRemoveFilter((item as any).rawId);
                                  } else if (section.title === 'SNIPPET KITS') {
                                    setSnippetKits(prev => prev.filter(sk => sk.id !== item.id));
                                  }
                                }
                              }}
                              className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded transition-all"
                              title="Delete Item"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className={`p-3 border-t ${theme.border} ${theme.sidebarBg} flex-shrink-0`}>
          <button 
            onClick={onOpenPublicLibrary}
            className={`w-full flex items-center justify-center gap-2 py-2.5 ${theme.inputBg} ${theme.text} text-[10px] font-black rounded uppercase tracking-widest hover:opacity-85 transition-all mb-2 border ${theme.border}`}
          >
            Public Library
          </button>
          <div className="flex items-center justify-between px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tight">
             <button onClick={() => alert("App Guide & onboarding loaded.")} className="hover:text-slate-400">App Guide</button>
             <span className="opacity-50">7.3.8-release</span>
          </div>
        </div>

        {/* 4.3 Inline Plus overlay Input Modal without redirecting the user */}
        {activeInlineAddSection && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className={`${theme.cardBg} border ${theme.border} p-4 rounded-xl w-full max-w-[240px] space-y-3 shadow-2xl animate-in zoom-in-95 duration-200`}>
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-1.5">
                <h3 className={`text-xs font-black uppercase tracking-wider ${theme.text}`}>
                  New {activeInlineAddSection === 'SNIPPET KITS' ? 'Snippet Kit' : activeInlineAddSection.slice(0, -1)}
                </h3>
                <button 
                  onClick={() => {
                    setActiveInlineAddSection(null);
                    setNewTagName('');
                    setNewFolderName('');
                    setNewFilterName('');
                    setNewFilterQuery('');
                    setNewKitName('');
                    setNewKitTag('');
                  }}
                  className="text-slate-500 hover:text-slate-200 p-0.5 text-xs font-black"
                >
                  ✕
                </button>
              </div>
              
              {/* TAGS quick form */}
              {activeInlineAddSection === 'TAGS' && (
                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tag Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g., designs"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded border ${theme.border} ${theme.inputBg} ${theme.text} outline-none font-semibold`}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateTagSubmit(); }}
                    />
                  </div>
                  <button
                    onClick={handleCreateTagSubmit}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded"
                  >
                    Create Tag
                  </button>
                </div>
              )}

              {/* FOLDERS quick form */}
              {activeInlineAddSection === 'FOLDERS' && (
                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Folder Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Inspiration"
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded border ${theme.border} ${theme.inputBg} ${theme.text} outline-none font-semibold`}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateFolderSubmit(); }}
                    />
                  </div>
                  <button
                    onClick={handleCreateFolderSubmit}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded"
                  >
                    Create Folder
                  </button>
                </div>
              )}

              {/* FILTERS Saved Search Query Builder */}
              {activeInlineAddSection === 'FILTERS' && (
                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Filter Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., React Snippets"
                      value={newFilterName}
                      onChange={e => setNewFilterName(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded border ${theme.border} ${theme.inputBg} ${theme.text} outline-none font-semibold mb-2`}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Query Keyword</label>
                    <input 
                      type="text" 
                      placeholder="e.g., useState"
                      value={newFilterQuery}
                      onChange={e => setNewFilterQuery(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded border ${theme.border} ${theme.inputBg} ${theme.text} outline-none font-semibold`}
                    />
                  </div>
                  <button
                    onClick={handleCreateFilterSubmit}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded"
                  >
                    Create Filter
                  </button>
                </div>
              )}

              {/* SNIPPET KITS Form */}
              {activeInlineAddSection === 'SNIPPET KITS' && (
                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Kit Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g., WEB DEV CORE"
                      value={newKitName}
                      onChange={e => setNewKitName(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded border ${theme.border} ${theme.inputBg} ${theme.text} outline-none font-semibold mb-2`}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Matching Tag</label>
                    <input 
                      type="text" 
                      placeholder="e.g., code"
                      value={newKitTag}
                      onChange={e => setNewKitTag(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded border ${theme.border} ${theme.inputBg} ${theme.text} outline-none font-semibold mb-2`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Color Accent</label>
                    <select 
                      value={newKitColor}
                      onChange={e => setNewKitColor(e.target.value)}
                      className={`w-full text-xs px-2 py-1.5 rounded border ${theme.border} ${theme.inputBg} ${theme.text} outline-none font-bold`}
                    >
                      <option value="text-rose-400">Rose Red</option>
                      <option value="text-emerald-400">Emerald Green</option>
                      <option value="text-indigo-400">Indigo Blue</option>
                      <option value="text-yellow-400">Yellow Gold</option>
                      <option value="text-purple-400">Purple Void</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateKitSubmit}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded"
                  >
                    Create Kit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4.4 Ellipsis sliding Bottom Sheet controls */}
        {activeEllipsisSection && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center">
            {/* Click outside backdrop to dismiss */}
            <div className="absolute inset-0" onClick={() => setActiveEllipsisSection(null)} />
            
            {/* Slide up container */}
            <div className={`${theme.cardBg} w-full rounded-t-2xl border-t ${theme.border} p-5 space-y-5 z-10 shadow-2xl animate-in slide-in-from-bottom duration-300`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>
                  {activeEllipsisSection} Settings
                </span>
                <button 
                  onClick={() => setActiveEllipsisSection(null)}
                  className="text-slate-500 hover:text-slate-200 p-1 font-black text-xs"
                >
                  ✕
                </button>
              </div>

              {/* List Style segment with custom style chips */}
              <div className="space-y-2 text-left">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  List Style
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['default', 'grid', 'comfortable', 'condensed'] as const).map((style) => {
                    const isSelected = (sectionListStyle[activeEllipsisSection] || 'default') === style;
                    return (
                      <button
                        key={style}
                        onClick={() => setSectionListStyle(prev => ({ ...prev, [activeEllipsisSection]: style }))}
                        className={`py-2 px-1 text-[9px] font-black rounded uppercase tracking-tight text-center transition-all ${
                          isSelected 
                            ? `${theme.accentBg} text-black font-extrabold shadow-lg` 
                            : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort By segment with sort options */}
              <div className="space-y-2 text-left">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['creation', 'editing', 'usage', 'length'] as const).map((sort) => {
                    const isSelected = (sectionSortBy[activeEllipsisSection] || 'creation') === sort;
                    const labelMap = {
                      creation: 'Creation Date',
                      editing: 'Editing Date',
                      usage: 'Usage Count',
                      length: 'Character Length'
                    };
                    return (
                      <button
                        key={sort}
                        onClick={() => setSectionSortBy(prev => ({ ...prev, [activeEllipsisSection]: sort }))}
                        className={`py-2.5 px-3 text-[9px] font-black rounded uppercase tracking-tight text-left transition-all flex items-center justify-between ${
                          isSelected 
                            ? `${theme.accentBg} text-black font-extrabold shadow-lg` 
                            : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                        }`}
                      >
                        <span>{labelMap[sort]}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </aside>
    </>
  );
};

export default Sidebar;
