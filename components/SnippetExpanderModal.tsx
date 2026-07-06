import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Calendar, AlignLeft, Sparkles, Check } from 'lucide-react';
import { Theme } from '../theme';

interface SnippetExpanderModalProps {
  clip: { id: string; title: string; content: string };
  onClose: () => void;
  theme: Theme;
}

export const SnippetExpanderModal: React.FC<SnippetExpanderModalProps> = ({
  clip,
  onClose,
  theme,
}) => {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Parse variables from template matching {{name}} or {{type:name}}
  const getPlaceholders = (text: string): string[] => {
    const regex = /\{\{(.*?)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return Array.from(new Set(matches)); // unique list
  };

  const placeholders = getPlaceholders(clip.content);

  useEffect(() => {
    const initialVars: Record<string, string> = {};
    placeholders.forEach(ph => {
      if (ph.toLowerCase() === 'date') {
        const today = new Date().toISOString().split('T')[0];
        initialVars[ph] = today;
      } else if (ph.startsWith('blank:')) {
        initialVars[ph] = '';
      } else if (ph.startsWith('ai_prompt:')) {
        initialVars[ph] = ph.replace('ai_prompt:', '').replace(/_/g, ' ');
      } else {
        initialVars[ph] = '';
      }
    });
    setVariables(initialVars);
  }, [clip.content]);

  const handleVariableChange = (ph: string, val: string) => {
    setVariables(prev => ({ ...prev, [ph]: val }));
  };

  // Compile final template
  const getCompiledText = (): string => {
    let result = clip.content;
    placeholders.forEach(ph => {
      const val = variables[ph] !== undefined ? variables[ph] : `{{${ph}}}`;
      result = result.replaceAll(`{{${ph}}}`, val);
    });
    return result;
  };

  const compiledText = getCompiledText();

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  const getLabelAndType = (ph: string) => {
    if (ph.toLowerCase() === 'date') {
      return { label: 'Date Placeholder', icon: Calendar, placeholder: 'YYYY-MM-DD' };
    }
    if (ph.startsWith('blank:')) {
      const cleanLabel = ph.replace('blank:', '').replace(/_/g, ' ');
      return { label: cleanLabel, icon: AlignLeft, placeholder: `Enter ${cleanLabel.toLowerCase()}...` };
    }
    if (ph.startsWith('ai_prompt:')) {
      const cleanLabel = ph.replace('ai_prompt:', '').replace(/_/g, ' ');
      return { label: `AI Prompt: ${cleanLabel}`, icon: Sparkles, placeholder: 'Enter prompt additions...' };
    }
    return { label: ph.replace(/_/g, ' '), icon: AlignLeft, placeholder: `Fill ${ph.toLowerCase()}...` };
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${theme.modalBg} border ${theme.border} rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${theme.border} flex items-center justify-between shrink-0`}>
          <div>
            <h2 className={`text-base font-black uppercase tracking-wider ${theme.text}`}>Expand Snippet Variables</h2>
            <p className="text-[10px] text-slate-500 font-medium">Fill placeholders to generate your personalized snippet</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-500/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Inputs section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-l-2 border-amber-500 pl-2">
              Variable Parameters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {placeholders.map((ph, idx) => {
                const info = getLabelAndType(ph);
                const IconComponent = info.icon;
                return (
                  <div key={idx} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <IconComponent className="w-3.5 h-3.5 text-amber-500" />
                      {info.label}
                    </label>
                    <input
                      type="text"
                      value={variables[ph] || ''}
                      onChange={(e) => handleVariableChange(ph, e.target.value)}
                      placeholder={info.placeholder}
                      className={`w-full px-4 py-2.5 ${theme.inputBg} ${theme.text} border ${theme.border} rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compiled Live Preview section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-l-2 border-amber-500 pl-2">
              Live Compiled Preview
            </h3>
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl min-h-[120px] font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
              {compiledText || <span className="text-slate-600 italic">Snippet is empty...</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 bg-slate-900/50 border-t ${theme.border} flex justify-end gap-3 shrink-0`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl ${theme.text} hover:bg-slate-500/10 transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
              copied ? 'bg-emerald-500 text-white' : `${theme.accentBg} text-black hover:scale-[1.01] active:scale-[0.99]`
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied Snippet!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Resolved Snippet
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
