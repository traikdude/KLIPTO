
export enum ClipType {
  TEXT = 'text',
  CODE = 'code',
  IMAGE = 'image',
}

export interface AIAnalysis {
  summary: string;
  category: string;
  keyPoints: string[];
  explanation?: string;
  sentiment?: string;
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  type: "image" | "video" | "audio" | "pdf" | "file";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  localUri?: string;
  remoteUri?: string;
  createdAt: string;
  thumbnailUrl?: string;
  previewMetadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

export interface Clip {
  id: string;
  content: string;
  type: ClipType;
  title: string;
  timestamp: number;
  tags: string[];
  aiAnalysis?: AIAnalysis;
  isFavorite: boolean;
  isDeleted?: boolean;
  folderId?: string;
  kitId?: string;
  metadata?: {
    language?: string;
    imageSrc?: string;
  };
  modifiedTimestamp?: number;
  usageCount?: number;
  attachments?: NoteAttachment[];
}

export type CategoryFilter = 'all' | 'text' | 'code' | 'image' | 'favorites';

export interface TagMetadata {
  label: string;
  emoji?: string;
  colorClass: string;
  bgIndicatorClass: string;
  outcomeDesc: string;
}

export const PREDEFINED_TAGS_MAP: Record<string, TagMetadata> = {
  'none': {
    label: 'none',
    colorClass: 'text-sky-400',
    bgIndicatorClass: 'bg-sky-400',
    outcomeDesc: 'Filters notes to code/script blocks'
  },
  'learn': {
    label: 'LEARN',
    emoji: '👩🏫',
    colorClass: 'text-indigo-300', // Lavender
    bgIndicatorClass: 'bg-indigo-300',
    outcomeDesc: 'Filters learning-related notes'
  },
  'search': {
    label: 'SEARCH',
    emoji: '🔍',
    colorClass: 'text-blue-400', // Muted blue
    bgIndicatorClass: 'bg-blue-400',
    outcomeDesc: 'Filters search/reference notes'
  },
  'emojis': {
    label: 'EMOJIS',
    emoji: '😆',
    colorClass: 'text-amber-400', // Yellow-gold
    bgIndicatorClass: 'bg-amber-400',
    outcomeDesc: 'Filters emoji notes'
  },
  'font styles': {
    label: 'FONT STYLES',
    emoji: '✒️',
    colorClass: 'text-slate-400', // Light grey
    bgIndicatorClass: 'bg-slate-400',
    outcomeDesc: 'Filters font/style notes'
  },
  'decorations': {
    label: 'DECORATIONS',
    emoji: '🌺',
    colorClass: 'text-pink-300', // Pastel pink
    bgIndicatorClass: 'bg-pink-300',
    outcomeDesc: 'Filters decoration notes'
  },
  'video ai': {
    label: 'VIDEO AI',
    emoji: '📹',
    colorClass: 'text-rose-400', // Red/pink
    bgIndicatorClass: 'bg-rose-400',
    outcomeDesc: 'Filters video AI notes'
  }
};

