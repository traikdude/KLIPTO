export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  bg: string;
  sidebarBg: string;
  cardBg: string;
  headerBg: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  accentText: string;
  accentBg: string;
  accentHover: string;
  inputBg: string;
  modalBg: string;
  statusBarBg: string;
  radioOutline: string;
}

export interface AppSettings {
  activeTheme: string;
  passcodeLockEnabled: boolean;
  fingerprintUnlockEnabled: boolean;
  appPasscode: string;
  syncNotesAutomatically: boolean;
  notesFromClipboardEnabled: boolean;
  universalClipboardEnabled: boolean;
  runAtStartupEnabled: boolean;
  doNotDisplayChangedNotes: boolean;
  silentNotificationsEnabled: boolean;
  clipboardLimit: number;
  swipeRightAction: string;
  swipeLeftAction: string;
  language: string;
  reviveEnabled?: boolean;
  fontFamily?: 'sans' | 'mono' | 'serif';
  fontSize?: 'sm' | 'base' | 'lg';
  listStyle?: 'default' | 'grid' | 'comfortable' | 'condensed';
  sortMethod?: 'creation' | 'editing' | 'usage' | 'length';
  sortOrder?: 'asc' | 'desc';
  customFontFamily?: string;
  customFontSize?: number;
  visibleTextLines?: number;
  localServerAddress?: string;
  focusTargeting?: 'editor' | 'search' | 'none';
  returnToAfterScan?: 'list' | 'editor';
  tentativeStepsEnabled?: boolean;
  clearSelectionAfterAction?: boolean;
}


export const themes: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Default',
    isDark: false,
    bg: 'bg-[#f5f6f8]',
    sidebarBg: 'bg-[#eef1f5]',
    cardBg: 'bg-white shadow-sm border border-slate-200',
    headerBg: 'bg-[#f5f6f8]',
    border: 'border-slate-200',
    borderSubtle: 'border-slate-100',
    text: 'text-slate-800',
    textMuted: 'text-slate-500',
    accentText: 'text-[#e5a900]',
    accentBg: 'bg-[#fbc02d]',
    accentHover: 'hover:bg-[#f5b01a]',
    inputBg: 'bg-slate-200/60',
    modalBg: 'bg-white',
    statusBarBg: 'bg-[#e0e4eb]',
    radioOutline: 'border-slate-300'
  },
  white: {
    id: 'white',
    name: 'White',
    isDark: false,
    bg: 'bg-[#ffffff]',
    sidebarBg: 'bg-[#f8fafc]',
    cardBg: 'bg-[#ffffff] shadow-sm border border-slate-200/60',
    headerBg: 'bg-[#ffffff]',
    border: 'border-slate-200/60',
    borderSubtle: 'border-slate-100',
    text: 'text-slate-900',
    textMuted: 'text-slate-400',
    accentText: 'text-blue-600',
    accentBg: 'bg-blue-500',
    accentHover: 'hover:bg-blue-600',
    inputBg: 'bg-slate-100',
    modalBg: 'bg-white',
    statusBarBg: 'bg-slate-100',
    radioOutline: 'border-slate-200'
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia',
    isDark: false,
    bg: 'bg-[#fcf8f2]',
    sidebarBg: 'bg-[#f5eee2]',
    cardBg: 'bg-[#ffffff] shadow-sm border border-amber-200/40',
    headerBg: 'bg-[#fcf8f2]',
    border: 'border-amber-200/40',
    borderSubtle: 'border-amber-100/30',
    text: 'text-amber-950',
    textMuted: 'text-amber-700/60',
    accentText: 'text-[#4f46e5]',
    accentBg: 'bg-[#4f46e5]',
    accentHover: 'hover:bg-[#4338ca]',
    inputBg: 'bg-[#f3ead8]',
    modalBg: 'bg-[#fcf8f2]',
    statusBarBg: 'bg-[#ecdcc3]',
    radioOutline: 'border-amber-200'
  },
  green: {
    id: 'green',
    name: 'Green',
    isDark: false,
    bg: 'bg-[#f4f7f4]',
    sidebarBg: 'bg-[#e8eee8]',
    cardBg: 'bg-[#ffffff] shadow-sm border border-emerald-200/40',
    headerBg: 'bg-[#f4f7f4]',
    border: 'border-emerald-200/40',
    borderSubtle: 'border-emerald-100/30',
    text: 'text-emerald-950',
    textMuted: 'text-emerald-700/60',
    accentText: 'text-rose-600',
    accentBg: 'bg-rose-500',
    accentHover: 'hover:bg-rose-600',
    inputBg: 'bg-[#dfebdf]',
    modalBg: 'bg-[#f4f7f4]',
    statusBarBg: 'bg-[#cfded3]',
    radioOutline: 'border-emerald-200'
  },
  pink: {
    id: 'pink',
    name: 'Pink',
    isDark: false,
    bg: 'bg-[#fdf6f7]',
    sidebarBg: 'bg-[#faeaed]',
    cardBg: 'bg-[#ffffff] shadow-sm border border-rose-200/40',
    headerBg: 'bg-[#fdf6f7]',
    border: 'border-rose-200/40',
    borderSubtle: 'border-rose-100/30',
    text: 'text-rose-950',
    textMuted: 'text-rose-700/60',
    accentText: 'text-pink-600',
    accentBg: 'bg-pink-500',
    accentHover: 'hover:bg-pink-600',
    inputBg: 'bg-[#f5dadf]',
    modalBg: 'bg-[#fdf6f7]',
    statusBarBg: 'bg-[#ebd3d8]',
    radioOutline: 'border-rose-200'
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    isDark: true,
    bg: 'bg-[#212121]',
    sidebarBg: 'bg-[#1a1a1a]',
    cardBg: 'bg-[#262626] border border-[#333]',
    headerBg: 'bg-[#212121]',
    border: 'border-[#2a2a2a]',
    borderSubtle: 'border-[#333]',
    text: 'text-slate-300',
    textMuted: 'text-slate-500',
    accentText: 'text-[#fbc02d]',
    accentBg: 'bg-[#fbc02d]',
    accentHover: 'hover:bg-[#f5b01a]',
    inputBg: 'bg-[#2a2a2a]',
    modalBg: 'bg-[#262626]',
    statusBarBg: 'bg-[#1e1e1e]',
    radioOutline: 'border-[#444]'
  },
  darkBlue: {
    id: 'darkBlue',
    name: 'Dark Blue',
    isDark: true,
    bg: 'bg-[#0f172a]',
    sidebarBg: 'bg-[#020617]',
    cardBg: 'bg-[#1e293b] border border-slate-700',
    headerBg: 'bg-[#0f172a]',
    border: 'border-slate-800',
    borderSubtle: 'border-slate-700',
    text: 'text-slate-200',
    textMuted: 'text-slate-400',
    accentText: 'text-sky-400',
    accentBg: 'bg-sky-500',
    accentHover: 'hover:bg-sky-600',
    inputBg: 'bg-[#1e293b]',
    modalBg: 'bg-[#1e293b]',
    statusBarBg: 'bg-[#0b0f19]',
    radioOutline: 'border-slate-600'
  },
  darkGreen: {
    id: 'darkGreen',
    name: 'Dark Green',
    isDark: true,
    bg: 'bg-[#061a12]',
    sidebarBg: 'bg-[#020d09]',
    cardBg: 'bg-[#0b2d20] border border-emerald-800',
    headerBg: 'bg-[#061a12]',
    border: 'border-emerald-900',
    borderSubtle: 'border-emerald-800',
    text: 'text-slate-200',
    textMuted: 'text-emerald-600',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-600',
    inputBg: 'bg-[#0b2d20]',
    modalBg: 'bg-[#0b2d20]',
    statusBarBg: 'bg-[#020a06]',
    radioOutline: 'border-emerald-700'
  },
  darkBlurple: {
    id: 'darkBlurple',
    name: 'Dark Blurple',
    isDark: true,
    bg: 'bg-[#18122b]',
    sidebarBg: 'bg-[#0f0c1b]',
    cardBg: 'bg-[#393053] border border-[#443c68]',
    headerBg: 'bg-[#18122b]',
    border: 'border-[#1f1a3a]',
    borderSubtle: 'border-[#443c68]',
    text: 'text-slate-200',
    textMuted: 'text-slate-400',
    accentText: 'text-indigo-400',
    accentBg: 'bg-[#6366f1]',
    accentHover: 'hover:bg-[#4f46e5]',
    inputBg: 'bg-[#211a3b]',
    modalBg: 'bg-[#393053]',
    statusBarBg: 'bg-[#0b0814]',
    radioOutline: 'border-[#443c68]'
  },
  amoled: {
    id: 'amoled',
    name: 'AMOLED Black',
    isDark: true,
    bg: 'bg-[#000000]',
    sidebarBg: 'bg-[#050505]',
    cardBg: 'bg-[#0d0d0d] border border-[#222]',
    headerBg: 'bg-[#000000]',
    border: 'border-[#111]',
    borderSubtle: 'border-[#222]',
    text: 'text-slate-100',
    textMuted: 'text-slate-600',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-600',
    accentHover: 'hover:bg-blue-700',
    inputBg: 'bg-[#0d0d0d]',
    modalBg: 'bg-[#0a0a0a]',
    statusBarBg: 'bg-[#000000]',
    radioOutline: 'border-[#222]'
  }
};
