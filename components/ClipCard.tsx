import React, { useState, useEffect, useRef } from 'react';
import { Clip, ClipType, PREDEFINED_TAGS_MAP } from '../types';
import { Theme } from '../theme';

interface ClipCardProps {
  clip: Clip;
  onClick: (clip: Clip) => void;
  onToggleFavorite: (id: string) => void;
  theme: Theme;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  fontFamily?: 'sans' | 'mono' | 'serif';
  fontSize?: 'sm' | 'base' | 'lg';
  listStyle?: 'default' | 'grid' | 'comfortable' | 'condensed';
  customFontFamily?: string;
  customFontSize?: number;
  visibleTextLines?: number;
  onCopy?: (clip: Clip) => void;
}

const ClipCard: React.FC<ClipCardProps> = ({ 
  clip, 
  onClick, 
  onToggleFavorite, 
  theme,
  isSelected = false,
  onToggleSelect,
  fontFamily = 'sans',
  fontSize = 'base',
  listStyle = 'grid',
  customFontFamily,
  customFontSize,
  visibleTextLines,
  onCopy
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCode = clip.type === ClipType.CODE;
  const isImage = clip.type === ClipType.IMAGE;

  // Format timestamp: "Created on MMM DD, YYYY H:MM:SS AM/PM"
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // convert '0' to '12'
    
    return `Created on ${month} ${day}, ${year} ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  // Rough estimate of note size in KB
  const charSize = clip.content ? (clip.content.length / 1024).toFixed(2) : "0.00";

  // Determine primary tag and corresponding metadata
  const primaryTag = clip.tags.length > 0 
    ? clip.tags[0] 
    : (isCode ? 'code' : isImage ? 'image' : '');

  const tagMeta = primaryTag ? PREDEFINED_TAGS_MAP[primaryTag.toLowerCase().trim()] : null;
  const tagEmoji = tagMeta?.emoji || '';
  const tagLabel = tagMeta?.label || primaryTag;

  // Typography rules mappings
  const fontFamilies = {
    sans: 'font-sans',
    mono: 'font-mono',
    serif: 'font-serif'
  };

  const titleFontSizes = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg md:text-xl'
  };

  const contentFontSizes = {
    sm: 'text-[11px] leading-relaxed',
    base: 'text-xs leading-relaxed',
    lg: 'text-sm leading-relaxed'
  };

  const activeFontFamily = fontFamilies[fontFamily] || 'font-sans';
  const activeTitleSize = titleFontSizes[fontSize] || 'text-sm';
  const activeContentSize = contentFontSizes[fontSize] || 'text-xs';

  // Custom font helper for premium typography
  const getFontFamilyStyle = (family?: string) => {
    if (!family || family === 'Default') return undefined;
    if (family === 'Alegreya') return "'Alegreya', serif";
    if (family === 'Noto Sans') return "'Noto Sans', sans-serif";
    if (family === 'Open Sans') return "'Open Sans', sans-serif";
    if (family === 'Ubuntu') return "'Ubuntu', sans-serif";
    if (family === 'Rubik') return "'Rubik', sans-serif";
    if (family === 'Roboto') return "'Roboto', sans-serif";
    if (family === 'Source Code Pro / Roboto Mono') return "'Source Code Pro', 'Roboto Mono', monospace";
    return undefined;
  };

  // CONDENSED VIEW: Completely flat, high-density table row with no body preview block
  if (listStyle === 'condensed') {
    return (
      <div 
        id={`clip-card-${clip.id}`}
        onClick={() => onClick(clip)}
        className={`note-card-container relative group flex flex-row items-center justify-between h-12 px-4 rounded-xl border transition-all duration-150 select-none cursor-pointer ${
          isSelected 
            ? 'is-selected scale-[0.99] shadow-sm border-transparent bg-blue-600/10' 
            : `${theme.cardBg} ${theme.border} hover:bg-slate-500/5`
        }`}
      >
        {/* Left Side: Multi-select Checkbox, Favorite star, short Date, and Bold Title */}
        <div className="flex items-center gap-3 overflow-hidden mr-4">
          {onToggleSelect && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(clip.id);
              }}
              className="cursor-pointer flex-shrink-0"
              title="Select note"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-blue-600 border-transparent text-white' 
                  : 'border-slate-500/40 hover:border-slate-400 bg-slate-500/5'
              }`}>
                {isSelected && (
                  <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {clip.isFavorite ? (
            <svg 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(clip.id);
              }}
              className="w-4 h-4 text-amber-500 fill-amber-500 star-btn flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" 
              viewBox="0 0 24 24"
              title="Unstar"
            >
              <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.87 1.4-8.168L.132 9.21l8.2-1.192L12 .587z" />
            </svg>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(clip.id);
              }}
              className="text-slate-600 hover:text-amber-500 transition-colors flex-shrink-0 unstarred-btn"
              title="Star"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}

          <span className="metadata-text text-[9px] text-slate-500 font-bold shrink-0 font-mono hidden md:inline-block">
            {new Date(clip.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
          </span>

          <h3 
            style={{
              fontFamily: getFontFamilyStyle(customFontFamily),
              fontSize: customFontSize ? `${customFontSize}px` : undefined,
            }}
            className={`font-bold truncate select-text ${isSelected ? 'text-slate-900' : theme.text}`}
          >
            {clip.title || "Untitled Snippet"}
          </h3>
        </div>

        {/* Right Side: Primary Tag capsule, Data Size, and Ellipsis action menu */}
        <div className="flex items-center gap-3 shrink-0 relative" ref={menuRef}>
          {primaryTag && (
            <span 
              title={tagMeta?.outcomeDesc || `Tag: ${primaryTag}`}
              className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-tight hidden sm:inline-flex items-center gap-0.5 ${
                tagMeta 
                  ? `${tagMeta.colorClass} border-slate-700/20 bg-slate-500/5` 
                  : 'text-slate-400 border-slate-700/25 bg-slate-500/5'
              }`}
            >
              {tagEmoji && <span className="text-[9.5px]">{tagEmoji}</span>}
              <span>{tagLabel}</span>
            </span>
          )}

          {clip.attachments && clip.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500 font-bold text-[9px] mr-1" title={`${clip.attachments.length} attachments`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{clip.attachments.length}</span>
            </span>
          )}
          <span className="font-mono text-[9px] text-slate-500 hidden sm:inline-block">
            {charSize} KB
          </span>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 rounded hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
            title="More actions"
          >
            <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>

          {/* Context menu popover */}
          {isMenuOpen && (
            <div className="absolute right-0 top-7 w-32 bg-[#1a1c23] border border-slate-800 rounded-lg shadow-2xl py-1 z-40 text-[10px] font-bold text-slate-200 overflow-hidden animate-in fade-in duration-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(clip.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 border-b border-slate-800/50"
              >
                <span className="text-amber-500">★</span>
                <span>{clip.isFavorite ? 'Unstar' : 'Star'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSelect) onToggleSelect(clip.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 border-b border-slate-800/50"
              >
                <span className="text-blue-500">✓</span>
                <span>{isSelected ? 'Deselect' : 'Select'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCopy) {
                    onCopy(clip);
                  } else {
                    navigator.clipboard.writeText(clip.content || '');
                    window.dispatchEvent(new CustomEvent('qlipto_toast', {
                      detail: { message: 'Copied to clipboard ✅', type: 'success' }
                    }));
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
              >
                <span className="text-emerald-400">⎙</span>
                <span>Copy</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STANDARD, DEFAULT, & COMFORTABLE CARD LAYOUTS:
  // Dynamically mapped dimensions
  const containerHeight = listStyle === 'default'
    ? 'h-36'
    : listStyle === 'comfortable'
      ? 'h-auto min-h-[15rem] pb-3'
      : 'h-64'; // Grid default height

  const textLineClamp = listStyle === 'default'
    ? 'line-clamp-2'
    : listStyle === 'comfortable'
      ? 'line-clamp-6'
      : 'line-clamp-5';

  const previewMargin = listStyle === 'default' ? 'mt-0.5' : 'mt-1';

  const activeLineClampClass = visibleTextLines !== undefined ? "" : textLineClamp;

  const bodyStyle: React.CSSProperties = {
    fontFamily: getFontFamilyStyle(customFontFamily),
    fontSize: customFontSize ? `${customFontSize}px` : undefined,
    lineHeight: customFontSize ? `${Math.round(customFontSize * 1.55)}px` : undefined,
    ...(visibleTextLines !== undefined ? {
      display: '-webkit-box',
      WebkitLineClamp: visibleTextLines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    } : {})
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: getFontFamilyStyle(customFontFamily),
  };

  return (
    <div 
      id={`clip-card-${clip.id}`}
      onClick={() => onClick(clip)}
      className={`note-card-container relative group ${containerHeight} flex flex-col justify-between overflow-hidden cursor-pointer select-none rounded-2xl border transition-all duration-200 ${
        isSelected 
          ? 'is-selected scale-[0.98] shadow-md border-transparent bg-blue-600/10' 
          : `${theme.cardBg} ${theme.border} hover:scale-[1.01] hover:shadow-lg`
      }`}
    >
      {/* 6.1 Metadata Row */}
      <div className="p-3.5 flex items-center justify-between z-10 border-b border-slate-700/5 select-none">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* Checkbox for multi-select */}
          {onToggleSelect && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(clip.id);
              }}
              className="mr-1 cursor-pointer flex-shrink-0"
              title="Select note"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-blue-600 border-transparent text-white' 
                  : 'border-slate-500/40 hover:border-slate-400 bg-slate-500/5'
              }`}>
                {isSelected && (
                  <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Star Favorite icon */}
          {clip.isFavorite ? (
            <svg 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(clip.id);
              }}
              className="w-4 h-4 text-amber-500 fill-amber-500 star-btn flex-shrink-0 animate-pulse cursor-pointer hover:scale-110 transition-transform" 
              viewBox="0 0 24 24"
              title="Unstar"
            >
              <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.87 1.4-8.168L.132 9.21l8.2-1.192L12 .587z" />
            </svg>
          ) : (
            !isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(clip.id);
                }}
                className="text-slate-600 hover:text-amber-500 transition-colors flex-shrink-0 unstarred-btn"
                title="Star"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )
          )}

          {/* Timestamp */}
          <span className="metadata-text card-time-span text-[10px] text-slate-500 font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {formatTimestamp(clip.timestamp)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 relative" ref={menuRef}>
          {/* Tag Capsule */}
          {primaryTag && (
            <span 
              title={tagMeta?.outcomeDesc || `Tag: ${primaryTag}`}
              className={`tag-capsule px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase flex items-center gap-1 transition-all ${
                tagMeta 
                  ? `${tagMeta.colorClass} border-slate-700/20 bg-slate-500/5` 
                  : 'text-slate-400 border-slate-700/25 bg-slate-500/5'
              }`}
            >
              {tagEmoji && <span className="text-[10.5px]">{tagEmoji}</span>}
              <span>{tagLabel}</span>
            </span>
          )}

          {/* Context Ellipsis trigger */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 rounded hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
            title="More actions"
          >
            <svg className="w-4.5 h-4.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>

          {/* Context Popover Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-7 w-36 bg-[#1a1c23] border border-slate-800 rounded-xl shadow-2xl py-1 z-40 text-[11px] font-bold text-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(clip.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 border-b border-slate-800/50 transition-colors"
              >
                <span className="text-amber-500 text-xs">★</span>
                <span>{clip.isFavorite ? 'Unstar Note' : 'Star Note'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSelect) onToggleSelect(clip.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 border-b border-slate-800/50 transition-colors"
              >
                <span className="text-blue-500 text-xs">✓</span>
                <span>{isSelected ? 'Deselect Note' : 'Select Note'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCopy) {
                    onCopy(clip);
                  } else {
                    navigator.clipboard.writeText(clip.content || '');
                    alert('Copied content to clipboard!');
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <span className="text-emerald-400 text-xs">⎙</span>
                <span>Copy Contents</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6.2 Title & Note Content Section */}
      <div className="flex-1 px-4 pb-2 overflow-hidden flex flex-col justify-start">
        {/* Title */}
        <h3 
          style={titleStyle}
          className={`font-extrabold truncate mb-1 select-text ${activeFontFamily} ${activeTitleSize} ${isSelected ? 'text-slate-900' : theme.text}`}
        >
          {clip.title || "Untitled Snippet"}
        </h3>

        {/* Dynamic preview block */}
        {isImage ? (
          <div className="flex-1 w-full bg-slate-500/5 rounded-xl overflow-hidden relative border border-slate-700/10 mt-0.5 select-none min-h-[4rem]">
            {clip.metadata?.imageSrc ? (
              <img 
                src={clip.metadata.imageSrc} 
                alt={clip.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <span>🖼️ No image data</span>
              </div>
            )}
            {clip.content && listStyle !== 'default' && (
              <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-xs p-2 text-[10px] text-slate-300 truncate">
                {clip.content}
              </div>
            )}
          </div>
        ) : isCode ? (
          <pre 
            style={bodyStyle}
            className={`flex-1 font-mono text-[10.5px] p-2.5 rounded-xl overflow-hidden border text-left whitespace-pre-wrap select-all ${previewMargin} ${
              isSelected 
                ? 'bg-slate-900/5 text-slate-800 border-slate-900/10' 
                : 'bg-slate-500/5 text-slate-400 border-slate-700/10'
            } ${activeLineClampClass}`}
          >
            {clip.content || "No code snippet content."}
          </pre>
        ) : (
          <p 
            style={bodyStyle}
            className={`flex-1 overflow-hidden text-left leading-relaxed ${previewMargin} whitespace-pre-wrap select-text ${activeFontFamily} ${activeContentSize} ${
              isSelected ? 'text-slate-700' : 'text-slate-400'
            } ${activeLineClampClass}`}
          >
            {clip.content || "Empty content."}
          </p>
        )}
      </div>

      {/* Footer Info strip */}
      <div className="px-4 py-2 border-t border-slate-700/5 flex items-center justify-between text-[10px] text-slate-500 font-semibold select-none">
        <div className="flex items-center gap-1.5 truncate mr-2">
          {clip.tags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx} 
              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                isSelected 
                  ? 'bg-blue-600/10 text-blue-800' 
                  : 'bg-slate-500/10 text-slate-400'
              }`}
            >
              #{tag}
            </span>
          ))}
          {clip.tags.length > 3 && (
            <span className="text-[9px] font-black text-slate-400">
              +{clip.tags.length - 3} more
            </span>
          )}
          {clip.tags.length === 0 && <span className="italic opacity-50 font-normal">#untagged</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
          {clip.attachments && clip.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500 font-bold" title={`${clip.attachments.length} attachments`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{clip.attachments.length}</span>
            </span>
          )}
          <span>{charSize} KB</span>
        </div>
      </div>
    </div>
  );
};

export default ClipCard;
