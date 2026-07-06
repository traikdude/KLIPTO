import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clip, ClipType, CategoryFilter, PREDEFINED_TAGS_MAP, NoteAttachment } from './types';
import Sidebar from './components/Sidebar';
import ClipCard from './components/ClipCard';
import NewClipModal from './components/NewClipModal';
import ClipDetailsModal from './components/ClipDetailsModal';
import { MediaCaptureModal } from './components/MediaCaptureModal';
import { saveAttachment } from './services/attachmentStore';
import SkillRunes from './components/SkillRunes';
import { themes, AppSettings, Theme } from './theme';
import { SnippetExpanderModal } from './components/SnippetExpanderModal';
import { LanguageSelector } from './components/LanguageSelector';
import { getTranslation } from './services/localization';
import { SettingsModal } from './components/SettingsModal';
import { PublicLibraryModal } from './components/PublicLibraryModal';
import { FilterBuilderModal } from './components/FilterBuilderModal';
import KeyboardCompanion from './components/KeyboardCompanion';
import { NotificationSystem } from './components/NotificationSystem';

const getSidebarBgColorHex = (id: string): string => {
  switch (id) {
    case 'default': return '#eef1f5';
    case 'white': return '#f8fafc';
    case 'sepia': return '#f5eee2';
    case 'green': return '#e8eee8';
    case 'pink': return '#faeaed';
    case 'dark': return '#1a1a1a';
    case 'darkBlue': return '#020617';
    case 'darkGreen': return '#020d09';
    case 'darkBlurple': return '#0f0c1b';
    case 'amoled': return '#050505';
    default: return '#050505';
  }
};

const getBorderColorHex = (id: string): string => {
  switch (id) {
    case 'default': return '#cbd5e1';
    case 'white': return '#cbd5e1';
    case 'sepia': return '#e7dbbe';
    case 'green': return '#cbd2cb';
    case 'pink': return '#e8dadc';
    case 'dark': return '#2a2a2a';
    case 'darkBlue': return '#1e293b';
    case 'darkGreen': return '#064e3b';
    case 'darkBlurple': return '#1f1a3a';
    case 'amoled': return '#111111';
    default: return '#111111';
  }
};

const initialMockClips: Clip[] = [
  {
    id: 'clip-1',
    title: 'FastAPI Router Example',
    content: 'from fastapi import APIRouter\n\nrouter = APIRouter()\n\n@router.get("/users")\ndef get_users():\n    return [{"id": 1, "username": "clipto_user"}]',
    type: ClipType.CODE,
    timestamp: Date.now() - 3600000 * 2,
    tags: ['code'],
    isFavorite: true,
    isDeleted: false,
    folderId: 'folder-root',
    metadata: { language: 'python' }
  },
  {
    id: 'clip-2',
    title: 'Project Ideas 💡',
    content: '- Build an AI-driven terminal manager\n- Integrate WebGPU canvas for real-time shaders\n- Create a lightweight Markdown editor with collaborative sync',
    type: ClipType.TEXT,
    timestamp: Date.now() - 3600000 * 24,
    tags: ['learn'],
    isFavorite: false,
    isDeleted: false,
    folderId: 'folder-root'
  },
  {
    id: 'clip-3',
    title: 'Cosmic Spaceship Illustration 🚀',
    content: 'An elegant vector spaceship exploring deep space.',
    type: ClipType.IMAGE,
    timestamp: Date.now() - 3600000 * 48,
    tags: ['image ai', 'decorations'],
    isFavorite: false,
    isDeleted: false,
    folderId: 'folder-root',
    metadata: {
      imageSrc: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=600&auto=format&fit=crop'
    }
  },
  {
    id: 'clip-4',
    title: 'Synapse_CoR Wizard Persona',
    content: 'Role: Grand Wizard of Synapse Chain-of-Reasoning.\nSystem Prompt: Engage CoT depth = 10, visualize mental tokens, and output answers in styled markdown blocks.',
    type: ClipType.TEXT,
    timestamp: Date.now() - 3600000 * 3,
    tags: ['synapse_cor', 'prompts'],
    isFavorite: true,
    isDeleted: false,
    folderId: 'folder-work'
  },
  {
    id: 'clip-5',
    title: 'Emoji Master catalog 😆',
    content: '✨🔥⚡💡🚀👾🧙🪄🔑🛡️📜📹🖼️📝⛩️🌺',
    type: ClipType.TEXT,
    timestamp: Date.now() - 3600000 * 5,
    tags: ['emojis', 'decorations'],
    isFavorite: false,
    isDeleted: false,
    folderId: 'folder-personal'
  },
  {
    id: 'clip-6',
    title: 'React 19 Server Actions Code',
    content: '"use server";\n\nexport async function updateProfile(formData: FormData) {\n  const name = formData.get("name");\n  await db.user.update({ name });\n}',
    type: ClipType.CODE,
    timestamp: Date.now() - 3600000 * 8,
    tags: ['code', 'learn'],
    isFavorite: false,
    isDeleted: false,
    folderId: 'folder-root',
    metadata: { language: 'typescript' }
  },
  {
    id: 'clip-7',
    title: 'Prompt Engineering Framework 📜',
    content: 'Structure: [Context] -> [Instruction] -> [Constraints] -> [Few-Shot Examples] -> [Output Format]',
    type: ClipType.TEXT,
    timestamp: Date.now() - 3600000 * 12,
    tags: ['prompts', 'prompt support'],
    isFavorite: true,
    isDeleted: false,
    folderId: 'folder-work'
  },
  {
    id: 'clip-8',
    title: 'YouTube video down script',
    content: 'import yt_dlp\n\ndef download_video(url):\n    ydl_opts = {}\n    with yt_dlp.YoutubeDL(ydl_opts) as ydl:\n        ydl.download([url])',
    type: ClipType.CODE,
    timestamp: Date.now() - 3600000 * 14,
    tags: ['code', 'youtube'],
    isFavorite: false,
    isDeleted: false,
    folderId: 'folder-root',
    metadata: { language: 'python' }
  },
  {
    id: 'clip-9',
    title: 'Vscode keybindings.json',
    content: '[\n  { "key": "ctrl+alt+k", "command": "qlipto.openConsole" }\n]',
    type: ClipType.CODE,
    timestamp: Date.now() - 3600000 * 18,
    tags: ['hotkeys', 'editor'],
    isFavorite: false,
    isDeleted: false,
    folderId: 'folder-root',
    metadata: { language: 'json' }
  },
  {
    id: 'clip-10',
    title: 'Magickal AI: Rune Summoning',
    content: 'Summoning Rune 34: Universal Clipboard Astral Syncer initialized. Streaming metadata to primary host on cloud port 3000.',
    type: ClipType.TEXT,
    timestamp: Date.now() - 3600000 * 20,
    tags: ['magickal ai', 'learn'],
    isFavorite: true,
    isDeleted: false,
    folderId: 'folder-personal'
  },
  {
    id: 'clip-11',
    title: 'Database Security Shield 🔑',
    content: 'Encrypted storage key: pbkdf2_sha256$800000$cli_sec_runes_v3',
    type: ClipType.TEXT,
    timestamp: Date.now() - 3600000 * 22,
    tags: ['password'],
    isFavorite: false,
    isDeleted: false,
    folderId: 'folder-work'
  },
  {
    id: 'clip-12',
    title: 'CSS Custom theme blueprint 🌺',
    content: '--font-sans: "Space Grotesk";\n--font-mono: "JetBrains Mono";\n--color-accent: #FF8A80;',
    type: ClipType.CODE,
    timestamp: Date.now() - 3600000 * 30,
    tags: ['font styles', 'decorations'],
    isFavorite: false,
    isDeleted: false,
    folderId: 'folder-root',
    metadata: { language: 'css' }
  }
];

const App: React.FC = () => {
  // Load clips from local storage or seed
  const [clips, setClips] = useState<Clip[]>(() => {
    const saved = localStorage.getItem('qlipto_clips');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialMockClips;
  });

  // Dynamic custom folders state
  const [folders, setFolders] = useState<{ id: string; name: string }[]>(() => {
    const saved = localStorage.getItem('qlipto_folders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'folder-root', name: 'Root Folder' },
      { id: 'folder-work', name: 'Work' },
      { id: 'folder-personal', name: 'Personal' }
    ];
  });

  // Dynamic custom saved search filters state
  const [filters, setFilters] = useState<{ id: string; name: string; query: string }[]>(() => {
    const saved = localStorage.getItem('qlipto_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'filter-1', name: 'AI Models', query: 'Gemini' },
      { id: 'filter-2', name: 'FastAPI', query: 'FastAPI' }
    ];
  });

  // Dynamic snippet kits state lifted from Sidebar.tsx
  const [snippetKits, setSnippetKits] = useState<{ id: string; name: string; tag: string; color: string }[]>(() => {
    const saved = localStorage.getItem('qlipto_snippet_kits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'kit-snippetz', name: 'SNIPPETZ 🧬', tag: 'code', color: 'text-rose-400' }
    ];
  });

  // Load settings from local storage
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('qlipto_settings');
    const defaultSettings: AppSettings = {
      activeTheme: 'amoled', // Set amoled black as default premium theme
      passcodeLockEnabled: false,
      fingerprintUnlockEnabled: false,
      appPasscode: '',
      syncNotesAutomatically: true,
      notesFromClipboardEnabled: true,
      universalClipboardEnabled: true,
      runAtStartupEnabled: true,
      doNotDisplayChangedNotes: true,
      silentNotificationsEnabled: false,
      clipboardLimit: 300,
      swipeRightAction: 'Copy',
      swipeLeftAction: 'Delete',
      language: 'en',
      reviveEnabled: true,
      fontFamily: 'sans',
      fontSize: 'base',
      listStyle: 'grid',
      sortMethod: 'creation',
      sortOrder: 'desc',
      customFontFamily: 'Default',
      customFontSize: 13,
      visibleTextLines: 3,
      tentativeStepsEnabled: true,
      clearSelectionAfterAction: true,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {}
    }
    return defaultSettings;
  });

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSkillRunesOpen, setIsSkillRunesOpen] = useState(false);
  const [isFABMenuOpen, setIsFABMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFontSheetOpen, setIsFontSheetOpen] = useState(false);
  const [isNewClipOpen, setIsNewClipOpen] = useState(false);
  const [newClipDefaultType, setNewClipDefaultType] = useState<ClipType>(ClipType.TEXT);
  const [isSortationPanelOpen, setIsSortationPanelOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [expandingSnippet, setExpandingSnippet] = useState<Clip | null>(null);
  const [isPublicLibraryOpen, setIsPublicLibraryOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [globalCaptureMode, setGlobalCaptureMode] = useState<'photo' | 'video' | 'audio' | 'barcode' | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Batch Selection Toolbar Modals
  const [isBatchTagModalOpen, setIsBatchTagModalOpen] = useState(false);
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);
  const [isBatchMoreSheetOpen, setIsBatchMoreSheetOpen] = useState(false);
  const [batchDeleteConfirmCount, setBatchDeleteConfirmCount] = useState(0);

  const handleImportLibraryClips = (clipsToImport: { title: string; content: string; type: 'text' | 'code' | 'image'; tags: string[] }[]) => {
    const activeCount = clips.filter(c => !c.isDeleted).length;
    if (activeCount + clipsToImport.length > 300) {
      alert(`⚠️ Cannot import package. This would exceed the 300 active notes quota limit!`);
      return;
    }

    const newClips: Clip[] = clipsToImport.map((c, index) => ({
      id: `clip-imported-${Date.now()}-${index}`,
      title: c.title,
      content: c.content,
      type: c.type === 'code' ? ClipType.CODE : c.type === 'image' ? ClipType.IMAGE : ClipType.TEXT,
      timestamp: Date.now() - index * 1000,
      tags: c.tags,
      isFavorite: false,
      isDeleted: false,
      folderId: 'folder-root'
    }));

    setClips(prev => [...newClips, ...prev]);
    alert(`📥 Successfully imported ${clipsToImport.length} shared item(s) into your root folder!`);
  };

  const handleImportLibraryTag = (tagName: string) => {
    const savedCustomTags = localStorage.getItem('qlipto_custom_tags');
    let customTagsList: string[] = [];
    if (savedCustomTags) {
      try {
        customTagsList = JSON.parse(savedCustomTags);
      } catch (e) {}
    }
    const cleanTag = tagName.toLowerCase().trim();
    if (cleanTag && !customTagsList.includes(cleanTag)) {
      customTagsList.push(cleanTag);
      localStorage.setItem('qlipto_custom_tags', JSON.stringify(customTagsList));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Multi-Selection State
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);

  // Lock status
  const [isAppLocked, setIsAppLocked] = useState(() => {
    const savedSettings = localStorage.getItem('qlipto_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return !!(parsed.passcodeLockEnabled && parsed.appPasscode);
      } catch (e) {}
    }
    return false;
  });
  const [enteredPasscode, setEnteredPasscode] = useState<string>('');
  const [unlockError, setUnlockError] = useState(false);

  // Focus targeting setup
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const target = settings.focusTargeting || 'editor';
    if (target === 'search' && !isAppLocked && !isSettingsOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 350);
    }
  }, [settings.focusTargeting, isAppLocked, isSettingsOpen]);

  // Map active theme
  const theme: Theme = themes[settings.activeTheme] || themes.amoled;

  // Persist clips, folders, and filters on change
  useEffect(() => {
    localStorage.setItem('qlipto_clips', JSON.stringify(clips));
  }, [clips]);

  useEffect(() => {
    localStorage.setItem('qlipto_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('qlipto_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('qlipto_snippet_kits', JSON.stringify(snippetKits));
  }, [snippetKits]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('qlipto_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleExportBackup = () => {
    const backupData = {
      clips,
      folders,
      filters,
      settings,
      version: '1.0.0',
      timestamp: Date.now()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipto-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    window.dispatchEvent(new CustomEvent('qlipto_sys_notification', {
      detail: {
        id: 'sys-backup-' + Date.now(),
        title: 'Backup complete.',
        description: 'Offline database index backup archive file successfully compiled and downloaded.',
        status: 'success'
      }
    }));
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: 'Backup complete. ✅', type: 'success' }
    }));
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        // Mock a sync-in-progress notification during load
        window.dispatchEvent(new CustomEvent('qlipto_sys_notification', {
          detail: {
            id: 'sys-sync',
            title: 'Sync in progress.',
            description: 'Decompressing backup archive streams and rebuilding offline indices...',
            status: 'running'
          }
        }));

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (parsed.clips && Array.isArray(parsed.clips)) {
              setClips(parsed.clips);
              if (parsed.folders && Array.isArray(parsed.folders)) setFolders(parsed.folders);
              if (parsed.filters && Array.isArray(parsed.filters)) setFilters(parsed.filters);
              if (parsed.settings) {
                setSettings(prev => ({ ...prev, ...parsed.settings }));
                localStorage.setItem('qlipto_settings', JSON.stringify({ ...settings, ...parsed.settings }));
              }
              
              // End sync and show success
              window.dispatchEvent(new CustomEvent('qlipto_sys_notification', {
                detail: {
                  id: 'sys-sync',
                  title: 'Sync completed successfully',
                  description: 'All local indexes populated and synchronized successfully.',
                  status: 'success'
                }
              }));
              window.dispatchEvent(new CustomEvent('qlipto_toast', {
                detail: { message: 'Backup loaded and restored successfully! ✅', type: 'success' }
              }));
            } else {
              window.dispatchEvent(new CustomEvent('qlipto_sys_notification', {
                detail: {
                  id: 'sys-import-' + Date.now(),
                  title: 'Import failed.',
                  description: 'Chosen file contains corrupted or invalid database structure formatting.',
                  status: 'failed'
                }
              }));
              window.dispatchEvent(new CustomEvent('qlipto_toast', {
                detail: { message: 'Import failed. 🚫', type: 'error' }
              }));
            }
          } catch (err) {
            window.dispatchEvent(new CustomEvent('qlipto_sys_notification', {
              detail: {
                id: 'sys-import-' + Date.now(),
                title: 'Import failed.',
                description: 'Restoration halted. Failed to parse backup archive JSON database formatting.',
                status: 'failed'
              }
            }));
            window.dispatchEvent(new CustomEvent('qlipto_toast', {
              detail: { message: 'Import failed. 🚫', type: 'error' }
            }));
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearStorage = () => {
    if (confirm('⚠️ WARNING: This will permanently wipe all notes, folders, and configuration indexes. Are you absolutely sure?')) {
      if (confirm('Double confirmation: All data will be irrecoverably lost. Proceed?')) {
        localStorage.clear();
        setClips([]);
        setFolders([
          { id: 'folder-root', name: 'Root Folder' },
          { id: 'folder-work', name: 'Work' },
          { id: 'folder-personal', name: 'Personal' }
        ]);
        setFilters([
          { id: 'filter-1', name: 'AI Models', query: 'Gemini' },
          { id: 'filter-2', name: 'FastAPI', query: 'FastAPI' }
        ]);
        setSettings({
          activeTheme: 'amoled',
          passcodeLockEnabled: false,
          fingerprintUnlockEnabled: false,
          appPasscode: '',
          syncNotesAutomatically: true,
          notesFromClipboardEnabled: true,
          universalClipboardEnabled: true,
          runAtStartupEnabled: true,
          doNotDisplayChangedNotes: true,
          silentNotificationsEnabled: false,
          clipboardLimit: 300,
          swipeRightAction: 'Copy',
          swipeLeftAction: 'Delete',
          language: 'en',
          reviveEnabled: true,
          fontFamily: 'sans',
          fontSize: 'base',
          listStyle: 'grid',
          sortMethod: 'creation',
          sortOrder: 'desc',
          customFontFamily: 'Default',
          customFontSize: 13,
          visibleTextLines: 3,
        });
        alert('🧹 Offline cache and localized storage database completely wiped!');
        window.location.reload();
      }
    }
  };

  const filteredClips = useMemo(() => {
    const filtered = clips.filter(clip => {
      // 1. Core Text Search Match
      const matchesSearch = (clip.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (clip.content || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Recycle Bin Filter Logic
      if (activeFilter === 'recycle') {
        if (!clip.isDeleted) return false;
      } else {
        if (clip.isDeleted) return false;
      }

      // 3. Category & Collection Filters
      let matchesFilter = activeFilter === 'all' || activeFilter === 'recycle';
      if (activeFilter === 'favorites') matchesFilter = clip.isFavorite;
      else if (activeFilter === 'text') matchesFilter = clip.type === ClipType.TEXT;
      else if (activeFilter === 'code') matchesFilter = clip.type === ClipType.CODE;
      else if (activeFilter === 'image') matchesFilter = clip.type === ClipType.IMAGE;
      else if (activeFilter === 'untagged') matchesFilter = !clip.tags || clip.tags.length === 0;
      else if (activeFilter.startsWith('tag-')) {
        const tagLabel = activeFilter.slice(4).toLowerCase();
        if (tagLabel === 'none') {
          matchesFilter = clip.type === ClipType.CODE;
        } else {
          matchesFilter = clip.tags.some(t => t.toLowerCase() === tagLabel);
        }
      } else if (activeFilter.startsWith('folder-') || activeFilter === 'folder-root') {
        matchesFilter = (clip.folderId || 'folder-root') === activeFilter;
      } else if (activeFilter.startsWith('filter-')) {
        const filterId = activeFilter.slice(7);
        const savedF = filters.find(f => f.id === filterId);
        if (savedF) {
          if ((savedF as any).rules) {
            const r = (savedF as any).rules;
            let match = true;
            
            // Tag Match rule
            if (r.tag && r.tag !== 'all') {
              if (r.tag === 'none') {
                if (clip.tags && clip.tags.length > 0) match = false;
              } else {
                if (!clip.tags || !clip.tags.some(t => t.toLowerCase() === r.tag!.toLowerCase())) match = false;
              }
            }

            // Folder Match rule
            if (r.folderId && r.folderId !== 'all') {
              if ((clip.folderId || 'folder-root') !== r.folderId) match = false;
            }

            // Date Range Match rule
            if (r.dateRange && r.dateRange !== 'all') {
              const now = Date.now();
              const clipTime = clip.timestamp || 0;
              const diffMs = now - clipTime;
              if (r.dateRange === 'today') {
                if (diffMs > 24 * 3600000) match = false;
              } else if (r.dateRange === 'week') {
                if (diffMs > 7 * 24 * 3600000) match = false;
              } else if (r.dateRange === 'month') {
                if (diffMs > 30 * 24 * 3600000) match = false;
              }
            }

            // Length Match rule
            if (r.lengthRule && r.lengthRule !== 'all') {
              const len = (clip.content || '').length;
              if (r.lengthRule === 'short' && len > 50) match = false;
              else if (r.lengthRule === 'medium' && (len <= 50 || len > 500)) match = false;
              else if (r.lengthRule === 'long' && len <= 500) match = false;
            }

            // Usage Count Match rule
            if (r.minUsageCount !== undefined && r.minUsageCount > 0) {
              const uc = clip.usageCount || 0;
              if (uc < r.minUsageCount) match = false;
            }

            // Content Query Match rule
            if (r.contentQuery && r.contentQuery.trim()) {
              const q = r.contentQuery.toLowerCase().trim();
              const textMatch = (clip.title || '').toLowerCase().includes(q) || 
                               (clip.content || '').toLowerCase().includes(q);
              if (!textMatch) match = false;
            }

            // Note Type Match rule
            if (r.noteType && r.noteType !== 'all') {
              if (clip.type !== r.noteType) match = false;
            }

            matchesFilter = match;
          } else {
            matchesFilter = (clip.title || '').toLowerCase().includes(savedF.query.toLowerCase()) || 
                             (clip.content || '').toLowerCase().includes(savedF.query.toLowerCase());
          }
        }
      } else if (activeFilter.startsWith('kit-')) {
        const foundKit = snippetKits.find(k => k.id === activeFilter);
        if (foundKit) {
          matchesFilter = clip.tags.some(t => t.toLowerCase() === foundKit.tag.toLowerCase());
        } else {
          matchesFilter = false;
        }
      }

      return matchesSearch && matchesFilter;
    });

    const sortMethod = settings.sortMethod || 'creation';
    const sortOrder = settings.sortOrder || 'desc';

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortMethod === 'creation') {
        comparison = (a.timestamp || 0) - (b.timestamp || 0);
      } else if (sortMethod === 'editing') {
        const tA = a.modifiedTimestamp || a.timestamp || 0;
        const tB = b.modifiedTimestamp || b.timestamp || 0;
        comparison = tA - tB;
      } else if (sortMethod === 'usage') {
        const uA = a.usageCount || 0;
        const uB = b.usageCount || 0;
        comparison = uA - uB;
      } else if (sortMethod === 'length') {
        const lenA = (a.content || '').length;
        const lenB = (b.content || '').length;
        comparison = lenA - lenB;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [clips, searchQuery, activeFilter, filters, settings.sortMethod, settings.sortOrder, snippetKits]);

  const activeFilterInfo = useMemo(() => {
    if (activeFilter === 'all') return { label: 'All Notes', count: filteredClips.length };
    if (activeFilter === 'favorites') return { label: 'Starred', count: filteredClips.length };
    if (activeFilter === 'recycle') return { label: 'Recycle Bin', count: filteredClips.length };
    if (activeFilter === 'untagged') return { label: 'Untagged', count: filteredClips.length };
    if (activeFilter === 'text') return { label: 'Clipboard', count: filteredClips.length };
    if (activeFilter === 'code') return { label: 'Snippets', count: filteredClips.length };
    
    if (activeFilter.startsWith('tag-')) {
      const tagLabel = activeFilter.slice(4).toLowerCase();
      const predefined = PREDEFINED_TAGS_MAP[tagLabel];
      const emojiPrefix = predefined?.emoji ? `${predefined.emoji} ` : '';
      return { 
         label: `Tag: ${emojiPrefix}${predefined?.label || tagLabel.toUpperCase()}`, 
        count: filteredClips.length 
      };
    }
    
    if (activeFilter.startsWith('folder-') || activeFilter === 'folder-root') {
      const folder = folders.find(f => f.id === activeFilter);
      return { label: `Folder: ${folder ? folder.name : 'Root Folder'}`, count: filteredClips.length };
    }
    
    if (activeFilter.startsWith('filter-')) {
      const filterId = activeFilter.slice(7);
      const savedF = filters.find(f => f.id === filterId);
      return { label: `Search: ${savedF ? savedF.name : 'Filter'}`, count: filteredClips.length };
    }

    if (activeFilter.startsWith('kit-')) {
      const foundKit = snippetKits.find(k => k.id === activeFilter);
      return { label: `Snippet Kit: ${foundKit ? foundKit.name : 'Kit'}`, count: filteredClips.length };
    }

    return { label: activeFilter, count: filteredClips.length };
  }, [activeFilter, filteredClips, folders, filters, snippetKits]);

  const handleToggleFavorite = (id: string) => {
    setClips(prev => prev.map(clip => {
      if (clip.id === id) {
        return { ...clip, isFavorite: !clip.isFavorite };
      }
      return clip;
    }));
  };

  const handleCreateClip = (title: string, content: string, type: ClipType, imageSrc?: string, tagToAssign?: string) => {
    // Quota Cap Check (300 active clips limit)
    const activeClipsCount = clips.filter(c => !c.isDeleted).length;
    if (activeClipsCount >= 300) {
      alert("⚠️ Free Tier Storage Cap Reached (300 / 300 active notes)!\nTo create more snippets, please clean up your Recycle Bin, delete existing notes, or upgrade to Clipto Premium.");
      return;
    }

    // Collect automatic simple tags
    const autoTags: string[] = [];
    if (type === ClipType.CODE) autoTags.push('code');
    if (type === ClipType.IMAGE) autoTags.push('image ai');
    if (tagToAssign) {
      if (!autoTags.includes(tagToAssign)) {
        autoTags.push(tagToAssign);
      }
    }
    
    const newClip: Clip = {
      id: 'clip-' + Date.now(),
      title,
      content: type === ClipType.IMAGE ? (content || 'An uploaded image') : content,
      type,
      timestamp: Date.now(),
      tags: autoTags,
      isFavorite: false,
      isDeleted: false,
      folderId: 'folder-root', // Created in Root Folder by default
      metadata: imageSrc ? { imageSrc } : undefined
    };
    setClips(prev => [newClip, ...prev]);
    setIsNewClipOpen(false);
  };

  // Recycle Bin operations passed down
  const handleDeleteClip = (id: string) => {
    if (pendingDeleteId === id) {
      setClips(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true } : c));
      setPendingDeleteId(null);
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: 'Note moved to Recycle Bin ✅', type: 'success' }
      }));
    } else {
      setPendingDeleteId(id);
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: 'Tap again to delete ⚠️', type: 'warning' }
      }));
      setTimeout(() => {
        setPendingDeleteId(prev => prev === id ? null : prev);
      }, 3000);
    }
  };

  const handleRestoreClip = (id: string) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, isDeleted: false } : c));
  };

  const handleDeletePermanently = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const handleAddFolder = (name: string) => {
    const newId = `folder-${Date.now()}`;
    setFolders(prev => [...prev, { id: newId, name }]);
  };

  const handleRemoveFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Reset any notes pointing to deleted folder back to root
    setClips(prev => prev.map(c => c.folderId === id ? { ...c, folderId: 'folder-root' } : c));
  };

  const handleAddFilter = (name: string, query: string, rules?: any) => {
    const newId = `filter-${Date.now()}`;
    setFilters(prev => [...prev, { id: newId, name, query, rules }]);
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  };

  const handleUnlockClick = (num: string) => {
    if (enteredPasscode.length >= 4) return;
    const nextDigits = enteredPasscode + num;
    setEnteredPasscode(nextDigits);

    if (nextDigits.length === 4) {
      setTimeout(() => {
        if (nextDigits === settings.appPasscode) {
          setIsAppLocked(false);
          setEnteredPasscode('');
        } else {
          setUnlockError(true);
          setEnteredPasscode('');
          setTimeout(() => setUnlockError(false), 800);
        }
      }, 200);
    }
  };

  // Selection Action Helpers
  const handleToggleSelect = (id: string) => {
    setSelectedClipIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredClips.map(c => c.id);
    const allSelected = visibleIds.every(id => selectedClipIds.includes(id));
    if (allSelected) {
      setSelectedClipIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedClipIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const handleBatchStarSelected = () => {
    if (selectedClipIds.length === 0) return;
    setClips(prev => prev.map(c => 
      selectedClipIds.includes(c.id) ? { ...c, isFavorite: true } : c
    ));
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: `Starred ${selectedClipIds.length} notes! ⭐`, type: 'success' }
    }));
  };

  const handleBatchUnstarSelected = () => {
    if (selectedClipIds.length === 0) return;
    setClips(prev => prev.map(c => 
      selectedClipIds.includes(c.id) ? { ...c, isFavorite: false } : c
    ));
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: `Removed stars from ${selectedClipIds.length} notes! 🌟`, type: 'success' }
    }));
  };

  const handleBatchAssignTag = (tagName: string) => {
    if (selectedClipIds.length === 0) return;
    const cleanTag = tagName.toLowerCase().trim();
    if (!cleanTag) return;
    
    setClips(prev => prev.map(c => {
      if (selectedClipIds.includes(c.id)) {
        const hasTag = c.tags && c.tags.some(t => t.toLowerCase() === cleanTag);
        const newTags = hasTag ? (c.tags || []) : [...(c.tags || []), cleanTag];
        return { ...c, tags: newTags };
      }
      return c;
    }));
    
    const lowerPredefined = Object.keys(PREDEFINED_TAGS_MAP).map(k => k.toLowerCase());
    if (!lowerPredefined.includes(cleanTag)) {
      const savedCustomTags = localStorage.getItem('qlipto_custom_tags');
      let customTagsList: string[] = [];
      if (savedCustomTags) {
        try {
          customTagsList = JSON.parse(savedCustomTags);
        } catch (e) {}
      }
      if (!customTagsList.includes(cleanTag)) {
        customTagsList.push(cleanTag);
        localStorage.setItem('qlipto_custom_tags', JSON.stringify(customTagsList));
        window.dispatchEvent(new Event('storage'));
      }
    }

    setIsBatchTagModalOpen(false);
    if (settings.clearSelectionAfterAction !== false) {
      setSelectedClipIds([]);
    }
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: `Assigned tag "${cleanTag.toUpperCase()}" to ${selectedClipIds.length} notes! ✅`, type: 'success' }
    }));
  };

  const handleBatchMoveFolder = (folderId: string) => {
    if (selectedClipIds.length === 0) return;
    setClips(prev => prev.map(c => 
      selectedClipIds.includes(c.id) ? { ...c, folderId } : c
    ));
    setIsBatchMoveModalOpen(false);
    if (settings.clearSelectionAfterAction !== false) {
      setSelectedClipIds([]);
    }
    const folderName = folders.find(f => f.id === folderId)?.name || 'Folder';
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: `Moved ${selectedClipIds.length} notes to ${folderName}! 📂`, type: 'success' }
    }));
  };

  const handleBatchDelete = () => {
    if (selectedClipIds.length === 0) return;
    
    if (settings.tentativeStepsEnabled && batchDeleteConfirmCount === 0) {
      setBatchDeleteConfirmCount(1);
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: 'Tap Delete again to double-confirm ⚠️', type: 'warning' }
      }));
      setTimeout(() => {
        setBatchDeleteConfirmCount(0);
      }, 3000);
      return;
    }

    setClips(prev => prev.map(c => 
      selectedClipIds.includes(c.id) ? { ...c, isDeleted: true } : c
    ));
    setBatchDeleteConfirmCount(0);
    
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: `Moved ${selectedClipIds.length} items to Recycle Bin ✅`, type: 'success' }
    }));

    if (settings.clearSelectionAfterAction !== false) {
      setSelectedClipIds([]);
    }
  };

  const handleCopyClip = (clip: Clip) => {
    const hasVariables = /\{\{(.*?)\}\}/.test(clip.content || '');
    if (hasVariables) {
      setExpandingSnippet(clip);
    } else {
      navigator.clipboard.writeText(clip.content || '');
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: 'Copied to clipboard ✅', type: 'success' }
      }));
    }
  };

  const handleBatchCopy = async () => {
    if (selectedClipIds.length === 0) return;
    const targetClips = clips.filter(c => selectedClipIds.includes(c.id));
    const chainedText = targetClips.map(c => `--- ${c.title} ---\n${c.content}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(chainedText);
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: `Copied ${selectedClipIds.length} notes' text to clipboard! ✅`, type: 'success' }
      }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('qlipto_toast', {
        detail: { message: 'Fallback clipboard copy active.', type: 'info' }
      }));
    }
  };

  const handleBatchInvertSelection = () => {
    const visibleIds = filteredClips.map(c => c.id);
    setSelectedClipIds(prev => {
      const currentSelectedVisible = prev.filter(id => visibleIds.includes(id));
      const newSelected = visibleIds.filter(id => !currentSelectedVisible.includes(id));
      const nonVisibleSelected = prev.filter(id => !visibleIds.includes(id));
      return [...nonVisibleSelected, ...newSelected];
    });
    setIsBatchMoreSheetOpen(false);
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: 'Inverted selection! 🔀', type: 'info' }
    }));
  };

  const handleBatchExportJSON = () => {
    const selectedClips = clips.filter(c => selectedClipIds.includes(c.id));
    const backupData = {
      clips: selectedClips,
      exportedAt: Date.now(),
      count: selectedClips.length,
      generator: 'Qlipto Batch Export'
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qlipto-batch-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsBatchMoreSheetOpen(false);
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: `Exported ${selectedClips.length} notes as JSON! 📥`, type: 'success' }
    }));
  };

  const handleBatchExportTXT = () => {
    const selectedClips = clips.filter(c => selectedClipIds.includes(c.id));
    const textReport = selectedClips.map(c => {
      const dateStr = new Date(c.timestamp).toLocaleString();
      return `========================================\nTITLE: ${c.title || 'Untitled'}\nDATE: ${dateStr}\nFOLDER: ${c.folderId}\nTAGS: ${c.tags.join(', ') || 'none'}\n----------------------------------------\n${c.content}\n========================================\n\n`;
    }).join('\n');
    const blob = new Blob([textReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qlipto-batch-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsBatchMoreSheetOpen(false);
    window.dispatchEvent(new CustomEvent('qlipto_toast', {
      detail: { message: `Downloaded plain text report! 📄`, type: 'success' }
    }));
  };

  const triggerImageOCR = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          alert("🔍 Gemini is reading the image and performing OCR. Please wait...");
          try {
            const res = await fetch('/api/gemini/analyze-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageSrc: base64 })
            });
            if (!res.ok) throw new Error("OCR server route returned error");
            const data = await res.json();
            handleCreateClip(
              `OCR: ${data.category || file.name}`,
              `${data.summary}\n\nKey details found:\n${data.keyPoints.map((kp: string) => `• ${kp}`).join('\n')}`,
              ClipType.IMAGE,
              base64
            );
            alert("✅ Gemini Image Analysis completed successfully! Saved as an image note.");
          } catch (err) {
            console.error(err);
            handleCreateClip(`Uploaded Image: ${file.name}`, 'An uploaded image attachment.', ClipType.IMAGE, base64);
            alert("Image saved. (Gemini OCR connection timed out, saved as local image note instead).");
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const summarizeLatestNote = async () => {
    const activeClips = clips.filter(c => !c.isDeleted);
    if (activeClips.length === 0) {
      alert("There are no notes in your workspace to summarize!");
      return;
    }
    const latestNote = activeClips[0];
    alert(`🤖 Gemini is generating a summary for your latest note: "${latestNote.title}"...`);
    try {
      const res = await fetch('/api/gemini/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: latestNote.content, type: latestNote.type })
      });
      if (!res.ok) throw new Error("Summarization failed on server");
      const data = await res.json();
      handleCreateClip(
        `AI Summary: ${latestNote.title}`,
        `Summary of "${latestNote.title}":\n\n${data.summary}\n\nKey takeaways:\n${data.keyPoints.map((kp: string) => `• ${kp}`).join('\n')}`,
        ClipType.TEXT
      );
      alert("✅ Summary saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Summarization connection timed out. Please ensure your Gemini API key is configured in Settings.");
    }
  };

  const autoCategorizeWorkspace = async () => {
    const activeClips = clips.filter(c => !c.isDeleted);
    if (activeClips.length === 0) {
      alert("No notes found to categorize!");
      return;
    }
    alert("🤖 Gemini is analyzing your workspace structure to auto-categorize notes. Please wait...");
    const notesToAnalyze = activeClips.slice(0, 5).map(c => ({ id: c.id, title: c.title, content: c.content }));
    const prompt = `Here are 5 recent notes in my workspace. Please analyze them and return a JSON object mapping each note ID to a recommended category label. Notes: ${JSON.stringify(notesToAnalyze)}`;
    try {
      const res = await fetch('/api/gemini/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: prompt, type: 'text' })
      });
      if (!res.ok) throw new Error("Auto-categorize failed");
      const data = await res.json();
      alert(`💡 Gemini Workspace Suggestions:\n\nRecommended Category: ${data.category || 'Information'}\n\nObservations:\n${data.summary}\n\nKey Findings:\n${data.keyPoints.map((kp: string) => `• ${kp}`).join('\n')}`);
    } catch (err) {
      console.error(err);
      alert("Could not complete auto-categorize. Please check your Gemini API key.");
    }
  };

  const fabMenuGroups = [
    {
      title: 'Create & Import',
      items: [
        { 
          label: 'New Text Note', 
          desc: 'Save text information and ideas instantly', 
          icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', 
          color: 'text-emerald-500', 
          action: () => {
            setNewClipDefaultType(ClipType.TEXT);
            setIsNewClipOpen(true);
          }
        },
        { 
          label: 'New Code Snippet', 
          desc: 'Format code notes with automatic syntax highlighting', 
          icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', 
          color: 'text-sky-500', 
          action: () => {
            setNewClipDefaultType(ClipType.CODE);
            setIsNewClipOpen(true);
          }
        },
        { 
          label: 'Copy from Clipboard', 
          desc: 'Capture clipboard buffer contents to a note', 
          icon: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1', 
          color: 'text-orange-500', 
          action: async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text) {
                handleCreateClip('Clipboard note', text, ClipType.TEXT);
                alert("📋 Text copied from clipboard and saved as a note!");
              } else {
                alert("Clipboard buffer is currently empty!");
              }
            } catch (e) {
              handleCreateClip('Cached Clipboard note', 'https://github.com/google/generative-ai-js', ClipType.TEXT);
              alert("📋 Note created from clipboard fallback link!");
            }
          } 
        },
        { 
          label: 'Import Text File', 
          desc: 'Upload a local text or markdown file as a note', 
          icon: 'M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12', 
          color: 'text-indigo-400', 
          action: () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.txt,.js,.py,.ts,.html,.css,.json,.md';
            fileInput.onchange = async (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 128 * 1024) {
                  alert("⚠️ File size exceeds 128 KB capacity limit!");
                  return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                  const textContent = event.target?.result as string;
                  handleCreateClip(file.name, textContent, ClipType.TEXT);
                  alert(`📥 Imported ${file.name} successfully!`);
                };
                reader.readAsText(file);
              }
            };
            fileInput.click();
          }
        },
      ]
    },
    {
      title: 'Files & Media',
      items: [
        { 
          label: 'Image OCR Intelligence', 
          desc: 'Analyze visual text using Gemini OCR', 
          icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', 
          color: 'text-pink-500', 
          action: triggerImageOCR 
        },
        { 
          label: 'Upload Image preview', 
          desc: 'Create an image note with visual preview', 
          icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z', 
          color: 'text-amber-500', 
          action: () => {
            setNewClipDefaultType(ClipType.IMAGE);
            setIsNewClipOpen(true);
          }
        },
        { 
          label: 'Scan Barcode / QR', 
          desc: 'Scan, parse, and save barcodes natively', 
          icon: 'M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M8 11h8M8 15h8', 
          color: 'text-sky-400', 
          action: () => {
            setGlobalCaptureMode('barcode');
          }
        },
      ]
    },
    {
      title: 'Classify & Structure',
      items: [
        { 
          label: 'Add New Folder', 
          desc: 'Create a new structural directory for grouping notes', 
          icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', 
          color: 'text-teal-400', 
          action: () => {
            const folderName = prompt("Enter new folder name:");
            if (folderName && folderName.trim()) {
              handleAddFolder(folderName.trim());
              alert(`📁 Folder "${folderName}" created successfully!`);
            }
          }
        },
        { 
          label: 'Save Search Filter', 
          desc: 'Add custom filter query for quick keyword navigation', 
          icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', 
          color: 'text-rose-400', 
          action: () => {
            const filterName = prompt("Enter filter label:");
            if (filterName && filterName.trim()) {
              const query = prompt(`Enter keyword query for filter "${filterName}":`);
              if (query !== null) {
                handleAddFilter(filterName.trim(), query.trim());
                alert(`🔍 Filter "${filterName}" saved!`);
              }
            }
          }
        },
      ]
    },
    {
      title: 'Smart AI Operations',
      items: [
        { 
          label: 'Summarize with Gemini', 
          desc: 'Generate rich executive summaries of your latest note', 
          icon: 'M13 10V3L4 14h7v7l9-11h-7z', 
          color: 'text-violet-400', 
          action: summarizeLatestNote 
        },
        { 
          label: 'Workspace Optimization', 
          desc: 'Run multi-note analysis and auto-categorization', 
          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', 
          color: 'text-amber-400', 
          action: autoCategorizeWorkspace 
        },
      ]
    },
  ];

  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    clips.forEach(clip => {
      if (clip.tags) {
        clip.tags.forEach(t => set.add(t));
      }
    });
    // Add predefined map tags
    Object.keys(PREDEFINED_TAGS_MAP).forEach(k => set.add(k));
    return Array.from(set);
  }, [clips]);

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} overflow-hidden relative font-sans`}>
      {/* 1. LOCK SCREEN OVERLAY */}
      {isAppLocked && settings.passcodeLockEnabled && settings.appPasscode && (
        <div className="fixed inset-0 bg-[#121212] z-50 flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-[#fbc02d]/10 rounded-full flex items-center justify-center text-[#fbc02d] mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Clipto Shield Engaged</h2>
          <p className="text-xs text-slate-500 mt-1 mb-8">Enter passcode to access database</p>

          <div className="flex gap-4 mb-10">
            {[0, 1, 2, 3].map((idx) => {
              const filled = enteredPasscode.length > idx;
              return (
                <div 
                  key={idx} 
                  className={`w-3.5 h-3.5 rounded-full border border-slate-700 transition-all duration-150 ${
                    filled ? 'bg-[#fbc02d] border-transparent scale-110' : 'bg-transparent'
                  } ${unlockError ? 'bg-red-500 border-transparent animate-bounce' : ''}`}
                ></div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-5 max-w-xs w-full mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button 
                key={num}
                onClick={() => handleUnlockClick(num)}
                className="w-15 h-15 bg-slate-800/40 hover:bg-slate-800/80 text-slate-200 font-bold rounded-full text-xl flex items-center justify-center transition-all active:scale-90 border border-slate-800/50"
              >
                {num}
              </button>
            ))}
            <button 
              onClick={() => {
                if (confirm("For security, clearing data will wipe all passcode cache and reset clipto database completely.")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-15 h-15 text-red-500 font-bold text-[10px] uppercase text-center flex items-center justify-center hover:text-red-400 transition-colors"
            >
              Reset App
            </button>
            <button 
              onClick={() => handleUnlockClick('0')}
              className="w-15 h-15 bg-slate-800/40 hover:bg-slate-800/80 text-slate-200 font-bold rounded-full text-xl flex items-center justify-center transition-all active:scale-90 border border-slate-800/50"
            >
              0
            </button>
            <button 
              onClick={() => setEnteredPasscode(prev => prev.slice(0, -1))}
              className="w-15 h-15 text-slate-500 font-bold flex items-center justify-center hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0010.828 5H20a2 2 0 012 2v10a2 2 0 01-2 2h-9.172a2 2 0 01-1.414-.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 2. SIDEBAR NAVIGATION */}
      <Sidebar 
        activeFilter={activeFilter} 
        onFilterChange={(f) => { 
          setActiveFilter(f); 
          setIsSkillRunesOpen(false); 
          setSelectedClipIds([]); // Reset selection when filtering
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSkillRunes={() => { setIsSkillRunesOpen(true); setIsSidebarOpen(false); }}
        onOpenSettings={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }}
        theme={theme}
        clips={clips}
        folders={folders}
        onAddFolder={handleAddFolder}
        onRemoveFolder={handleRemoveFolder}
        filters={filters}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        settings={settings}
        onAddClip={() => {
          setNewClipDefaultType(ClipType.TEXT);
          setIsNewClipOpen(true);
        }}
        onOpenPublicLibrary={() => setIsPublicLibraryOpen(true)}
        onOpenFilterBuilder={() => setIsFilterBuilderOpen(true)}
        snippetKits={snippetKits}
        setSnippetKits={setSnippetKits}
      />
      
      {/* 3. MAIN CONTAINER */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden border-l ${theme.border}`}>
        {isSkillRunesOpen ? (
          <SkillRunes 
            onBack={() => setIsSkillRunesOpen(false)} 
            settings={settings}
            updateSetting={updateSetting}
            theme={theme}
            clips={clips}
            setClips={setClips}
          />
        ) : (
          <>
            {/* Header segment */}
            <header className={`${theme.headerBg} border-b ${theme.border} px-5 py-3.5 flex items-center justify-between flex-shrink-0`}>
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 text-slate-400 hover:text-slate-200 md:hidden rounded-lg hover:bg-slate-500/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex-1 max-w-md relative mx-4">
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder={getTranslation(settings.language, 'searchPlaceholder')} 
                  className={`w-full pl-4 pr-10 py-2 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-all font-semibold`} 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
                <button className="absolute inset-y-0 right-0 px-3 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Select All / Deselect All Toggle button */}
                {filteredClips.length > 0 && (
                  <button 
                    onClick={handleToggleSelectAll}
                    title="Toggle Select All"
                    className="px-3 py-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 font-bold text-[10px] uppercase rounded-xl transition-all"
                  >
                    {filteredClips.every(id => selectedClipIds.includes(id.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                )}

                {/* Quick Shield lock tester */}
                {settings.passcodeLockEnabled && settings.appPasscode && (
                  <button 
                    onClick={() => {
                      setIsAppLocked(true);
                      setEnteredPasscode('');
                    }}
                    title="Lock Clipto Database"
                    className="p-2 text-amber-500 hover:text-amber-400 rounded-lg hover:bg-slate-500/10 transition-all"
                  >
                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                )}

                {/* Main List Style & Sortation Panel Trigger */}
                <button 
                  onClick={() => setIsSortationPanelOpen(true)}
                  title="List Layout & Sorting Options"
                  className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-500/10 transition-colors flex items-center gap-1"
                >
                  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                  </svg>
                  <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline ml-0.5">Layout</span>
                </button>

                 {/* Typography Settings Button */}
                 <button 
                   onClick={() => setIsFontSheetOpen(true)}
                   title={getTranslation(settings.language, 'typography')}
                   className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-500/10 transition-colors flex items-center gap-1"
                 >
                   <span className="text-sm font-black font-serif select-none px-0.5">Aa</span>
                   <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline ml-0.5">
                     {getTranslation(settings.language, 'typography')}
                   </span>
                 </button>

                 {/* Localization Dropdown Selector */}
                 <LanguageSelector 
                   currentLanguage={settings.language || 'en'}
                   onLanguageChange={(code) => updateSetting('language', code)}
                   isDarkTheme={theme.isDark}
                   borderClass={theme.border}
                   cardBgClass={theme.modalBg}
                   textClass={theme.text}
                 />

                 <button 
                   onClick={() => setIsSettingsOpen(true)}
                   className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-500/10 transition-colors flex items-center gap-1"
                   title={getTranslation(settings.language, 'settings')}
                 >
                   <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                   </svg>
                   <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline ml-0.5">
                     {getTranslation(settings.language, 'layout')}
                   </span>
                 </button>
              </div>
            </header>

            {/* Note Grid View list */}
            <div className={`flex-1 overflow-y-auto p-6 md:p-8 ${theme.bg}`}>
              {/* Active Filter Header Display */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-500/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
                  <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    {activeFilterInfo.label}
                  </h1>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-400 font-mono border border-slate-700/10">
                    {activeFilterInfo.count} {activeFilterInfo.count === 1 ? getTranslation(settings.language, 'notesCountSingular') : getTranslation(settings.language, 'notesCountPlural')}
                  </span>
                </div>
              </div>

              {filteredClips.length > 0 ? (
                <div className={
                  settings.listStyle === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    : settings.listStyle === 'comfortable'
                      ? "flex flex-col gap-5 max-w-5xl mx-auto"
                      : settings.listStyle === 'condensed'
                        ? "flex flex-col gap-1.5 max-w-5xl mx-auto"
                        : "flex flex-col gap-3 max-w-5xl mx-auto"
                }>
                  {filteredClips.map(clip => (
                    <ClipCard 
                      key={clip.id} 
                      clip={clip} 
                      onClick={(c) => {
                        if (selectedClipIds.length > 0) {
                          handleToggleSelect(c.id);
                        } else {
                          const updatedClip = { ...c, usageCount: (c.usageCount || 0) + 1 };
                          setClips(prev => prev.map(item => item.id === c.id ? updatedClip : item));
                          setSelectedClip(updatedClip);
                        }
                      }} 
                      onToggleFavorite={handleToggleFavorite}
                      theme={theme}
                      isSelected={selectedClipIds.includes(clip.id)}
                      onToggleSelect={handleToggleSelect}
                      fontFamily={settings.fontFamily}
                      fontSize={settings.fontSize}
                      listStyle={settings.listStyle}
                      customFontFamily={settings.customFontFamily}
                      customFontSize={settings.customFontSize}
                      visibleTextLines={settings.visibleTextLines}
                      onCopy={handleCopyClip}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center opacity-70">
                   <div className="w-16 h-16 bg-slate-500/5 rounded-full flex items-center justify-center mb-4 text-slate-400 border border-slate-700/10">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                     </svg>
                   </div>
                   <h2 className="text-lg font-bold uppercase tracking-tight mb-1">{activeFilter}</h2>
                   <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                     No notes match this filter category or search term. Use the yellow plus button below to create one!
                   </p>
                </div>
              )}
            </div>

            {/* INTERACTIVE BATCH ACTION BOTTOM DOCK TOOLBAR */}
            {selectedClipIds.length > 0 && (
              <div 
                id="batch-action-toolbar"
                className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#0c0c0e] text-slate-200 border border-slate-800 px-5 py-3.5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-4.5 z-40 max-w-lg w-[92%] animate-in slide-in-from-bottom-8 duration-300 justify-between backdrop-blur-xl"
              >
                {/* Left controls: Clear and Selection Count */}
                <div className="flex items-center gap-3">
                  <button 
                    id="btn-batch-clear"
                    onClick={() => {
                      setSelectedClipIds([]);
                      setBatchDeleteConfirmCount(0);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl transition-all"
                    title="Deselect All"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Select Counter Hub */}
                  <button 
                    id="btn-batch-toggle-select"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-2 bg-[#fbc02d] hover:bg-[#f5b01a] text-black px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-md active:scale-95"
                    title="Toggle all visible notes"
                  >
                    <span className="w-2 h-2 rounded-full bg-black/80 animate-pulse" />
                    <span>{selectedClipIds.length} SELECTED</span>
                  </button>
                </div>

                {/* Right controls: Required Actions: Star, Tag, Move, Copy, Delete, More */}
                <div className="flex items-center gap-1.5 md:gap-2">
                  {/* Star Button */}
                  <button 
                    id="btn-batch-star"
                    onClick={handleBatchStarSelected}
                    className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all active:scale-90"
                    title="Star Selected Notes"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Tag Button */}
                  <button 
                    id="btn-batch-tag"
                    onClick={() => {
                      setIsBatchTagModalOpen(true);
                      setBatchDeleteConfirmCount(0);
                    }}
                    className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all active:scale-90"
                    title="Assign Tag to Selected"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 14.5a1 1 0 11-2 0 1 1 0 012 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.45 2.5a2 2 0 011.414.586l4.05 4.05a2 2 0 010 2.828l-8.543 8.543a4 4 0 01-1.885 1.053l-3.834 1.01a1 1 0 01-1.212-1.212l1.01-3.834a4 4 0 011.053-1.885l8.543-8.543A2 2 0 0115.45 2.5z" />
                    </svg>
                  </button>

                  {/* Move Button */}
                  <button 
                    id="btn-batch-move"
                    onClick={() => {
                      setIsBatchMoveModalOpen(true);
                      setBatchDeleteConfirmCount(0);
                    }}
                    className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all active:scale-90"
                    title="Move Selected to Folder"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </button>

                  {/* Copy Button */}
                  <button 
                    id="btn-batch-copy"
                    onClick={handleBatchCopy}
                    className="p-2.5 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-xl transition-all active:scale-90"
                    title="Copy Selected Content"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>

                  {/* Delete Button (Double-confirm aware) */}
                  <button 
                    id="btn-batch-delete"
                    onClick={handleBatchDelete}
                    className={`p-2.5 rounded-xl transition-all active:scale-90 flex items-center gap-1 ${
                      batchDeleteConfirmCount > 0 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse px-3 py-1.5' 
                        : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'
                    }`}
                    title={batchDeleteConfirmCount > 0 ? 'Click AGAIN to Confirm Delete ⚠️' : 'Delete Selected Notes'}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {batchDeleteConfirmCount > 0 && (
                      <span className="text-[9px] font-black uppercase tracking-wider">TAP AGAIN</span>
                    )}
                  </button>

                  {/* More Button */}
                  <button 
                    id="btn-batch-more"
                    onClick={() => {
                      setIsBatchMoreSheetOpen(true);
                      setBatchDeleteConfirmCount(0);
                    }}
                    className="p-2.5 text-slate-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-xl transition-all active:scale-90"
                    title="More Actions"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Sticky Bottom Actions with curved cutout and golden-orange FAB */}
            <div className={`h-16 border-t ${theme.border} ${theme.sidebarBg} flex items-center justify-between px-6 relative flex-shrink-0 z-10`}>
               {/* Curved cutout background container mask */}
               <div 
                 className="absolute left-1/2 -translate-x-1/2 -top-8 w-18 h-18 rounded-full border-t z-0"
                 style={{
                   backgroundColor: getSidebarBgColorHex(settings.activeTheme),
                   borderColor: getBorderColorHex(settings.activeTheme)
                 }}
               />

               <button 
                onClick={() => setIsSettingsOpen(true)} 
                className="text-slate-400 hover:text-slate-200 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors relative z-10"
               >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span>Layout</span>
               </button>
               
               {/* PRIMARY FAB: Centered inside curved cutout, styled golden-orange with white plus icon */}
               <button 
                onClick={() => setIsFABMenuOpen(true)} 
                className="w-13 h-13 bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-orange-500/20 active:scale-95 hover:scale-105 transition-all absolute left-1/2 -translate-x-1/2 -top-5 z-20"
               >
                 <svg className="w-6.5 h-6.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4" />
                 </svg>
               </button>

               <button 
                onClick={() => {
                  setClips(prev => [...prev].reverse());
                  alert("Toggled sorting order of clips!");
                }}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors relative z-10"
               >
                  <span>Sort</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18v2H3V4zm3 7h12v2H6v-2zm3 7h6v2H9v-2z"/>
                  </svg>
               </button>
            </div>
          </>
        )}
      </main>

      {/* FAB Multi-Action sliding bottom sheet */}
      <AnimatePresence>
        {isFABMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
              onClick={() => setIsFABMenuOpen(false)}
            />

            {/* Slide-up Sheet */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 250 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(event, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsFABMenuOpen(false);
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#121212] border-t border-slate-800 rounded-t-3xl z-50 flex flex-col shadow-2xl select-none max-h-[85vh] overflow-hidden"
              style={{
                backgroundColor: getSidebarBgColorHex(settings.activeTheme) === '#f8fafc' || getSidebarBgColorHex(settings.activeTheme) === '#eef1f5' ? '#ffffff' : '#141416',
                borderColor: getBorderColorHex(settings.activeTheme)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1 bg-slate-700/60 hover:bg-slate-500 rounded-full mx-auto mt-3 mb-2 flex-shrink-0 cursor-grab active:cursor-grabbing" />

              {/* Header */}
              <div className="px-6 py-2 flex items-center justify-between border-b border-slate-800 flex-shrink-0" style={{ borderColor: getBorderColorHex(settings.activeTheme) }}>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-500">Workspace Navigator</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Grouped workflow actions & settings</p>
                </div>
                <button 
                  onClick={() => setIsFABMenuOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-500/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Categories (Vertically Scrollable) */}
              <div className="overflow-y-auto p-6 space-y-6 max-h-[60vh] pb-10">
                {fabMenuGroups.map((group, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-amber-500 pl-2">
                      {group.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {group.items.map((item, itemIdx) => (
                        <button
                          key={itemIdx}
                          onClick={() => {
                            setIsFABMenuOpen(false);
                            if (item.action) item.action();
                          }}
                          className="flex items-start gap-4 w-full p-3.5 rounded-2xl hover:bg-slate-500/5 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-slate-500/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-slate-500/10 transition-colors">
                            <svg className={`w-5.5 h-5.5 ${item.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-200 group-hover:text-amber-500 transition-colors">{item.label}</p>
                            <p className="text-slate-500 text-[11px] leading-relaxed font-medium mt-0.5">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Settings Panel */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          updateSetting={updateSetting}
          theme={theme}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onClearStorage={handleClearStorage}
        />
      )}

      {/* 4. NEW NOTE MODAL POPUP */}
      {isNewClipOpen && (
        <NewClipModal 
          onClose={() => setIsNewClipOpen(false)} 
          onSave={handleCreateClip}
          theme={theme}
          defaultType={newClipDefaultType}
          snippetKits={snippetKits}
        />
      )}

      {/* GLOBAL MEDIA / BARCODE CAPTURE MODAL */}
      {globalCaptureMode && (
        <MediaCaptureModal
          mode={globalCaptureMode}
          onClose={() => setGlobalCaptureMode(null)}
          theme={theme}
          onSaveAttachment={async (blob, name, type, extraContent) => {
            const attachmentId = 'attach-' + Date.now();
            const noteId = 'clip-' + Date.now();
            
            try {
              await saveAttachment({
                id: attachmentId,
                name,
                size: blob.size,
                type,
                data: blob,
                timestamp: Date.now()
              });
            } catch (err) {
              console.error("Failed to save scanned attachment:", err);
            }

            const newAttachment: NoteAttachment = {
              id: attachmentId,
              noteId,
              type: type.startsWith('image/') ? 'image' : type.startsWith('video/') ? 'video' : type.startsWith('audio/') ? 'audio' : 'file',
              fileName: name,
              mimeType: type,
              sizeBytes: blob.size,
              localUri: `indexeddb://${attachmentId}`,
              createdAt: new Date().toISOString()
            };

            const activeClipsCount = clips.filter(c => !c.isDeleted).length;
            if (activeClipsCount >= 300) {
              alert("⚠️ Free Tier Storage Cap Reached (300 / 300 active notes)!\nTo create more snippets, please clean up your Recycle Bin.");
              return;
            }

            // Extract barcode type/value from the formatted string for a clean title
            let displayTitle = 'Scanned Barcode';
            if (extraContent) {
              const decodedLine = extraContent.split('\n').find(line => line.includes('Decoded '));
              if (decodedLine) {
                displayTitle = decodedLine.replace('Decoded ', '').trim();
              }
            }

            const newClip: Clip = {
              id: noteId,
              title: displayTitle,
              content: extraContent || 'Scanned barcode payload.',
              type: ClipType.TEXT,
              timestamp: Date.now(),
              tags: ['scanned', 'barcode'],
              isFavorite: false,
              isDeleted: false,
              folderId: 'folder-root',
              attachments: [newAttachment]
            };

            setClips(prev => [newClip, ...prev]);
            setGlobalCaptureMode(null);

            if ((settings.returnToAfterScan || 'editor') === 'editor') {
              setSelectedClip(newClip);
            } else {
              alert(`🎯 Scanned successfully! Saved note: "${displayTitle}" in your notes list.`);
            }
          }}
        />
      )}

      {/* 7. MAIN LIST STYLE + SORTATION BOTTOM SHEET PANEL */}
      {isSortationPanelOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4 select-none">
          {/* Backdrop close target */}
          <div className="absolute inset-0" onClick={() => setIsSortationPanelOpen(false)} />
          
          <div className="relative w-full sm:max-w-md bg-[#16171d] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250 z-10 flex flex-col max-h-[90vh]">
            {/* Elegant Drag Handle indicator for mobile */}
            <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-3 mb-2 sm:hidden" />

            {/* Title / Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎛️</span>
                <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                  List Layout & Sortation
                </h2>
              </div>
              <button 
                onClick={() => setIsSortationPanelOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Options container with nice paddings and spacing */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* 7.1 Display Density / List Style Options */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Display Density / Layout
                  </h3>
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {settings.listStyle || 'grid'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'default', label: 'Default', desc: 'Standard row spacing', icon: '📝' },
                    { id: 'grid', label: 'Grid', desc: 'Tile/card layout', icon: '🎚️' },
                    { id: 'comfortable', label: 'Comfortable', desc: 'Large row spacing', icon: '📖' },
                    { id: 'condensed', label: 'Condensed', desc: 'Tight horizontal rows', icon: '≡' }
                  ].map(item => {
                    const isSelected = (settings.listStyle || 'grid') === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          updateSetting('listStyle', item.id as any);
                        }}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? `${theme.accentBg} text-black border-transparent shadow-xl scale-[1.02]`
                            : 'bg-slate-500/5 text-slate-300 border-slate-800 hover:bg-slate-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-extrabold text-xs mb-0.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span className={`text-[9px] font-semibold leading-tight ${isSelected ? 'text-black/80' : 'text-slate-500'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7.2 Sort By Options */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Sort Notes By
                  </h3>
                  <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {settings.sortMethod === 'creation' ? 'Creation Date' : settings.sortMethod === 'editing' ? 'Editing Date' : settings.sortMethod === 'usage' ? 'Usage Count' : 'Content Length'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'creation', label: 'Creation Date', desc: 'Date created timestamp', icon: '📅' },
                    { id: 'editing', label: 'Editing Date', desc: 'Last modified timestamp', icon: '✒️' },
                    { id: 'usage', label: 'Usage Count', desc: 'Most-used snippets first', icon: '📊' },
                    { id: 'length', label: 'Character Length', desc: 'By length of text content', icon: '📏' }
                  ].map(item => {
                    const isSelected = (settings.sortMethod || 'creation') === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          updateSetting('sortMethod', item.id as any);
                        }}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-transparent shadow-xl scale-[1.02]'
                            : 'bg-slate-500/5 text-slate-300 border-slate-800 hover:bg-slate-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-extrabold text-xs mb-0.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span className={`text-[9px] font-semibold leading-tight ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Order Toggle */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Sort Direction
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'desc', label: 'Descending', desc: 'Newest / Largest first', icon: '⬇️' },
                    { id: 'asc', label: 'Ascending', desc: 'Oldest / Smallest first', icon: '⬆️' }
                  ].map(item => {
                    const isSelected = (settings.sortOrder || 'desc') === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          updateSetting('sortOrder', item.id as any);
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-transparent shadow-lg'
                            : 'bg-slate-500/5 text-slate-300 border-slate-800 hover:bg-slate-500/10'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Sheet Footer */}
            <div className="p-4 bg-[#121319] border-t border-slate-800/60 flex items-center justify-end">
              <button
                onClick={() => setIsSortationPanelOpen(false)}
                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${theme.accentBg} text-black text-center`}
              >
                Done / Apply Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4.5 TYPOGRAPHY & FONT CONTROL SHEET */}
      {isFontSheetOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6" 
          onClick={() => setIsFontSheetOpen(false)}
        >
          <div 
            className={`${theme.modalBg} border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl w-full md:max-w-xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl`} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-5 flex items-center justify-between border-b ${theme.border} bg-slate-900/40`}>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black font-serif text-amber-500 select-none">Aa</span>
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${theme.text}`}>Typography Settings</h3>
                  <p className="text-slate-500 text-[10px] font-bold">Customize text family, scaling, and compact list views</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFontSheetOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-500/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable controls */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-left">
              {/* Option 1: Font Family Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Font Family
                  </h4>
                  <span className="text-xs font-black text-amber-500 font-mono">
                    {settings.customFontFamily || 'Default'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Default', label: 'Default' },
                    { id: 'Alegreya', label: 'Alegreya' },
                    { id: 'Noto Sans', label: 'Noto Sans' },
                    { id: 'Open Sans', label: 'Open Sans' },
                    { id: 'Ubuntu', label: 'Ubuntu' },
                    { id: 'Rubik', label: 'Rubik' },
                    { id: 'Roboto', label: 'Roboto' },
                    { id: 'Source Code Pro / Roboto Mono', label: 'Source/Roboto Mono' }
                  ].map(fontItem => {
                    const isSelected = (settings.customFontFamily || 'Default') === fontItem.id;
                    
                    // helper map for live capsule style
                    const getFontFamilyStyleLocal = (family: string) => {
                      if (family === 'Default') return undefined;
                      if (family === 'Alegreya') return "'Alegreya', serif";
                      if (family === 'Noto Sans') return "'Noto Sans', sans-serif";
                      if (family === 'Open Sans') return "'Open Sans', sans-serif";
                      if (family === 'Ubuntu') return "'Ubuntu', sans-serif";
                      if (family === 'Rubik') return "'Rubik', sans-serif";
                      if (family === 'Roboto') return "'Roboto', sans-serif";
                      if (family === 'Source Code Pro / Roboto Mono') return "'Source Code Pro', 'Roboto Mono', monospace";
                      return undefined;
                    };

                    const itemStyle: React.CSSProperties = {
                      fontFamily: getFontFamilyStyleLocal(fontItem.id)
                    };

                    return (
                      <button
                        key={fontItem.id}
                        style={itemStyle}
                        onClick={() => {
                          updateSetting('customFontFamily', fontItem.id);
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500 text-black border-transparent shadow-lg font-bold'
                            : 'bg-slate-500/5 text-slate-300 border-slate-800 hover:bg-slate-500/10 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs truncate">{fontItem.label}</span>
                        <span className="text-[10px] opacity-70 font-bold">Aa</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 2: Text Size Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Text Size Selector
                  </h4>
                  <span className="text-xs font-black text-amber-500 font-mono bg-slate-500/10 px-2.5 py-0.5 rounded-md border border-slate-700/20">
                    {settings.customFontSize || 13}px
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 text-xs font-bold font-mono">11px</span>
                  <input 
                    type="range"
                    min="11"
                    max="24"
                    step="1"
                    value={settings.customFontSize || 13}
                    onChange={(e) => updateSetting('customFontSize', parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-slate-500 text-xs font-bold font-mono">24px</span>
                </div>
              </div>

              {/* Option 3: Visible Text Lines Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Visible Text Lines (Clamp)
                  </h4>
                  <span className="text-xs font-black text-amber-500 font-mono bg-slate-500/10 px-2.5 py-0.5 rounded-md border border-slate-700/20">
                    {settings.visibleTextLines === 1 ? '1 Line (Ultra compact)' : `${settings.visibleTextLines || 3} Lines`}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 text-xs font-bold font-mono">1 Line</span>
                  <input 
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={settings.visibleTextLines || 3}
                    onChange={(e) => updateSetting('visibleTextLines', parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-slate-500 text-xs font-bold font-mono">10 Lines</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Note body clamping. A value of 1 creates an ultra dense list interface, while higher settings show more readable contents.
                </p>
              </div>

              {/* Dynamic Live Preview Card */}
              <div className="pt-4 border-t border-slate-800/60">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  Live Typography Simulator
                </h4>
                
                <div className={`${theme.cardBg} ${theme.border} border p-4.5 rounded-2xl max-w-md mx-auto shadow-xl`}>
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Live Preset Preview</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold font-mono">
                      Font: {settings.customFontFamily || 'Default'}
                    </span>
                  </div>
                  
                  <h3 
                    style={{ 
                      fontFamily: (settings.customFontFamily && settings.customFontFamily !== 'Default') ? (
                        settings.customFontFamily === 'Alegreya' ? "'Alegreya', serif" :
                        settings.customFontFamily === 'Noto Sans' ? "'Noto Sans', sans-serif" :
                        settings.customFontFamily === 'Open Sans' ? "'Open Sans', sans-serif" :
                        settings.customFontFamily === 'Ubuntu' ? "'Ubuntu', sans-serif" :
                        settings.customFontFamily === 'Rubik' ? "'Rubik', sans-serif" :
                        settings.customFontFamily === 'Roboto' ? "'Roboto', sans-serif" :
                        settings.customFontFamily === 'Source Code Pro / Roboto Mono' ? "'Source Code Pro', 'Roboto Mono', monospace" : undefined
                      ) : undefined
                    }}
                    className={`font-black text-sm mb-1.5 ${theme.text}`}
                  >
                    Quick Brown Fox jumps over...
                  </h3>
                  
                  <p 
                    style={{
                      fontFamily: (settings.customFontFamily && settings.customFontFamily !== 'Default') ? (
                        settings.customFontFamily === 'Alegreya' ? "'Alegreya', serif" :
                        settings.customFontFamily === 'Noto Sans' ? "'Noto Sans', sans-serif" :
                        settings.customFontFamily === 'Open Sans' ? "'Open Sans', sans-serif" :
                        settings.customFontFamily === 'Ubuntu' ? "'Ubuntu', sans-serif" :
                        settings.customFontFamily === 'Rubik' ? "'Rubik', sans-serif" :
                        settings.customFontFamily === 'Roboto' ? "'Roboto', sans-serif" :
                        settings.customFontFamily === 'Source Code Pro / Roboto Mono' ? "'Source Code Pro', 'Roboto Mono', monospace" : undefined
                      ) : undefined,
                      fontSize: `${settings.customFontSize || 13}px`,
                      lineHeight: `${Math.round((settings.customFontSize || 13) * 1.55)}px`,
                      display: '-webkit-box',
                      WebkitLineClamp: settings.visibleTextLines || 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    className="text-slate-400 select-none whitespace-pre-wrap text-left leading-relaxed"
                  >
                    This simulator card updates live! Adjust typography sliders to watch the body paragraph size change, select a new typeface family, or toggle compact line counts. The line height recalculates automatically to {Math.round((settings.customFontSize || 13) * 1.55)}px for visual balance!
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className={`p-4 bg-slate-950/90 border-t ${theme.border} flex items-center justify-between`}>
              <button 
                onClick={() => {
                  updateSetting('customFontFamily', 'Default');
                  updateSetting('customFontSize', 13);
                  updateSetting('visibleTextLines', 3);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Reset Default
              </button>
              <button 
                onClick={() => setIsFontSheetOpen(false)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${theme.accentBg} text-black`}
              >
                Done / Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. NOTE DETAILS MODAL */}
      {selectedClip && (
        <ClipDetailsModal 
          clip={selectedClip} 
          onClose={() => setSelectedClip(null)} 
          onUpdate={(updatedClip) => {
            setClips(prev => prev.map(c => c.id === updatedClip.id ? updatedClip : c));
            setSelectedClip(updatedClip);
          }}
          onDelete={handleDeleteClip}
          onRestore={handleRestoreClip}
          onDeletePermanently={handleDeletePermanently}
          theme={theme}
          folders={folders}
          onCopy={handleCopyClip}
          snippetKits={snippetKits}
        />
      )}

      {/* 6. SNIPPET EXPANDER MODAL */}
      {expandingSnippet && (
        <SnippetExpanderModal
          clip={expandingSnippet}
          onClose={() => setExpandingSnippet(null)}
          theme={theme}
        />
      )}

      {/* 7. PUBLIC LIBRARY MODAL */}
      <PublicLibraryModal
        isOpen={isPublicLibraryOpen}
        onClose={() => setIsPublicLibraryOpen(false)}
        theme={theme}
        onImportClips={handleImportLibraryClips}
        onImportTag={handleImportLibraryTag}
      />

      {/* 8. COMPOUND FILTER BUILDER MODAL */}
      <FilterBuilderModal
        isOpen={isFilterBuilderOpen}
        onClose={() => setIsFilterBuilderOpen(false)}
        theme={theme}
        folders={folders}
        tags={allUniqueTags}
        onSaveFilter={handleAddFilter}
      />

      {/* BATCH ACTION: TAG ASSIGNMENT MODAL */}
      {isBatchTagModalOpen && (
        <div 
          id="batch-tag-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div 
            className="w-full max-w-md bg-[#0c0c0e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-800/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <span>🏷️</span> Assign Tag to Selected
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Apply a label to all {selectedClipIds.length} checked items.
                </p>
              </div>
              <button 
                id="btn-close-batch-tag"
                onClick={() => setIsBatchTagModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[350px] overflow-y-auto">
              {/* Custom Tag Input */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider pl-1">
                  Create / Assign New Tag
                </label>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = document.getElementById('custom-batch-tag-input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleBatchAssignTag(input.value);
                      input.value = '';
                    }
                  }}
                  className="flex gap-2"
                >
                  <input 
                    id="custom-batch-tag-input"
                    type="text"
                    placeholder="e.g. WORK, IMPORTANT, LOGS..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono placeholder:text-slate-600"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md"
                  >
                    Assign
                  </button>
                </form>
              </div>

              {/* Tag Selection Grid */}
              <div className="space-y-3">
                <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider pl-1">
                  Predefined & Custom Tags Catalog
                </label>
                <div className="flex flex-wrap gap-2">
                  {/* Predefined Tags */}
                  {Object.keys(PREDEFINED_TAGS_MAP).map(tagKey => {
                    const tagInfo = PREDEFINED_TAGS_MAP[tagKey];
                    return (
                      <button 
                        key={tagKey}
                        onClick={() => handleBatchAssignTag(tagKey)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/5 text-slate-300 hover:text-amber-400 rounded-xl text-xs font-medium transition-all"
                      >
                        <span>{tagInfo.emoji}</span>
                        <span className="font-mono text-[10px]">{tagInfo.label}</span>
                      </button>
                    );
                  })}
                  {/* Loaded Custom Tags from local storage */}
                  {(() => {
                    const savedCustomTags = localStorage.getItem('qlipto_custom_tags');
                    let list: string[] = [];
                    if (savedCustomTags) {
                      try { list = JSON.parse(savedCustomTags); } catch (e) {}
                    }
                    const predefinedKeys = Object.keys(PREDEFINED_TAGS_MAP).map(k => k.toLowerCase());
                    const filteredCustom = list.filter(t => t && !predefinedKeys.includes(t.toLowerCase()));
                    
                    if (filteredCustom.length === 0) return null;
                    return filteredCustom.map(t => (
                      <button 
                        key={t}
                        onClick={() => handleBatchAssignTag(t)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-500/5 text-slate-300 hover:text-amber-400 rounded-xl text-xs font-medium transition-all"
                      >
                        <span>✨</span>
                        <span className="font-mono text-[10px] uppercase">{t}</span>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 flex justify-end">
              <button 
                id="btn-cancel-batch-tag"
                onClick={() => setIsBatchTagModalOpen(false)}
                className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH ACTION: FOLDER PICKER MODAL */}
      {isBatchMoveModalOpen && (
        <div 
          id="batch-move-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div 
            className="w-full max-w-md bg-[#0c0c0e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-800/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <span>📂</span> Move Selected to Folder
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Relocate all {selectedClipIds.length} checked items into a custom folder container.
                </p>
              </div>
              <button 
                id="btn-close-batch-move"
                onClick={() => setIsBatchMoveModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Folder List Content */}
            <div className="p-5 max-h-[300px] overflow-y-auto space-y-2">
              <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider pl-1 mb-1">
                Choose Destination Folder Container
              </label>
              {folders.map(folder => (
                <button 
                  key={folder.id}
                  onClick={() => handleBatchMoveFolder(folder.id)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left text-slate-300 hover:text-amber-400 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg select-none group-hover:scale-110 transition-transform">
                      {folder.id === 'folder-root' ? '💻' : folder.id === 'folder-work' ? '💼' : folder.id === 'folder-personal' ? '❤️' : '📁'}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider">{folder.name}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {folder.id}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-amber-400 font-bold transition-colors">Select →</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 flex justify-end">
              <button 
                id="btn-cancel-batch-move"
                onClick={() => setIsBatchMoveModalOpen(false)}
                className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH ACTION: MORE OPTIONS BOTTOM SHEET */}
      {isBatchMoreSheetOpen && (
        <div 
          id="batch-more-sheet"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setIsBatchMoreSheetOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#0c0c0e] border-t border-x border-slate-800 rounded-t-[2.5rem] overflow-hidden shadow-2xl text-slate-200 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle accent */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-800/60 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  ⚡ Advanced Batch Action Panel
                </h3>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">
                  Apply compound mutations on {selectedClipIds.length} currently checked notes.
                </p>
              </div>
              <button 
                id="btn-close-batch-more"
                onClick={() => setIsBatchMoreSheetOpen(false)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-200 rounded-xl transition-all border border-slate-800"
              >
                Done
              </button>
            </div>

            {/* Action Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto">
              {/* Invert Selection */}
              <button 
                id="btn-batch-invert"
                onClick={handleBatchInvertSelection}
                className="flex items-center gap-3.5 p-3.5 bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left text-slate-300 hover:text-amber-400 rounded-2xl transition-all group"
              >
                <span className="text-lg bg-amber-500/10 p-2 rounded-xl group-hover:scale-110 transition-all select-none">🔀</span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider">Invert Checked Selection</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Toggle checkmark on all other visible notes</p>
                </div>
              </button>

              {/* Star All */}
              <button 
                id="btn-batch-star-all"
                onClick={() => {
                  handleBatchStarSelected();
                  setIsBatchMoreSheetOpen(false);
                }}
                className="flex items-center gap-3.5 p-3.5 bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left text-slate-300 hover:text-amber-400 rounded-2xl transition-all group"
              >
                <span className="text-lg bg-amber-500/10 p-2 rounded-xl group-hover:scale-110 transition-all select-none">⭐</span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider">Star All Selected</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Force favorite status to true on current batch</p>
                </div>
              </button>

              {/* Unstar All */}
              <button 
                id="btn-batch-unstar-all"
                onClick={() => {
                  handleBatchUnstarSelected();
                  setIsBatchMoreSheetOpen(false);
                }}
                className="flex items-center gap-3.5 p-3.5 bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left text-slate-300 hover:text-amber-400 rounded-2xl transition-all group"
              >
                <span className="text-lg bg-amber-500/10 p-2 rounded-xl group-hover:scale-110 transition-all select-none">🌟</span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider">Unstar All Selected</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Clear favorite/starred status from selection</p>
                </div>
              </button>

              {/* Export Selected as JSON */}
              <button 
                id="btn-batch-export-json"
                onClick={handleBatchExportJSON}
                className="flex items-center gap-3.5 p-3.5 bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left text-slate-300 hover:text-amber-400 rounded-2xl transition-all group"
              >
                <span className="text-lg bg-amber-500/10 p-2 rounded-xl group-hover:scale-110 transition-all select-none">📥</span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider">Export Selected (JSON)</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Download selected notes as a JSON backup</p>
                </div>
              </button>

              {/* Download Selected as Plain Text Report */}
              <button 
                id="btn-batch-export-txt"
                onClick={handleBatchExportTXT}
                className="flex items-center gap-3.5 p-3.5 bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left text-slate-300 hover:text-amber-400 rounded-2xl transition-all group"
              >
                <span className="text-lg bg-amber-500/10 p-2 rounded-xl group-hover:scale-110 transition-all select-none">📄</span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider">Download Text Report</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Assemble a readable plain text report of batch</p>
                </div>
              </button>

              {/* Deselect All */}
              <button 
                id="btn-batch-deselect-all"
                onClick={() => {
                  setSelectedClipIds([]);
                  setBatchDeleteConfirmCount(0);
                  setIsBatchMoreSheetOpen(false);
                }}
                className="flex items-center gap-3.5 p-3.5 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/40 text-left text-slate-300 hover:text-red-400 rounded-2xl transition-all group"
              >
                <span className="text-lg bg-red-500/10 p-2 rounded-xl group-hover:scale-110 transition-all select-none">🧹</span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider">Deselect Checklist</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Clear selection checkpoints and reset count</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. FLOATING KEYBOARD COMPANION OVERLAY */}
      <KeyboardCompanion
        theme={theme}
        clips={clips}
        snippetKits={snippetKits}
        setSnippetKits={setSnippetKits}
        onImportClips={handleImportLibraryClips}
        onAddClip={(title, content, type, tags) => {
          handleCreateClip(title, content, type, undefined, tags[0]);
        }}
        onSelectClipToEdit={(clip) => setSelectedClip(clip)}
      />

      {/* 10. SYSTEM NOTIFICATIONS AND TOAST HUB */}
      <NotificationSystem 
        theme={theme} 
        silentNotificationsEnabled={settings.silentNotificationsEnabled} 
      />
    </div>
  );
};

export default App;
