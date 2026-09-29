import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ExternalLink,
  CornerDownLeft,
  AlertCircle,
} from 'lucide-react';
import {
  resolveCommand,
  CommandResolution,
} from '../services/commandEngine';
import { safeOpenUrl } from '../utils/navigation';
import { getSettings, addCommandHistory } from '../services/storageService';

interface CommandBoxProps {
  initialValue?: string | null;
  onExecuteSuccess?: (resolution: CommandResolution) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  autoFocus?: boolean;
  effectiveTheme?: 'dark' | 'light';
}

const PLACEHOLDER_ROTATIONS = [
  'open YouTube',
  'open WhatsApp',
  'open GitHub',
  'open Instagram',
  'open LinkedIn',
  'open Gmail',
  'open ChatGPT',
  'open Spotify',
  'search Next.js documentation',
];

export const CommandBox: React.FC<CommandBoxProps> = ({
  initialValue,
  onExecuteSuccess,
  onNavigateTab,
  onOpenSettings,
  onOpenHelp,
  autoFocus = true,
  effectiveTheme = 'dark',
}) => {
  const isDark = effectiveTheme === 'dark';
  const [query, setQuery] = useState(initialValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'unknown' | 'error' | null;
    message: string;
    targetName?: string;
    url?: string;
    suggestions?: string[];
  }>({ type: null, message: '' });

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Detect platform for ⌘K vs Ctrl+K
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
    }
  }, []);

  // Sync initialValue if provided from parent (e.g. rerun from History)
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
      handleExecute(initialValue);
    }
  }, [initialValue]);

  // Rotate placeholder text gently every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_ROTATIONS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Global keyboard shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExecute = (customCmd?: string) => {
    const textToRun = (customCmd !== undefined ? customCmd : query).trim();
    if (!textToRun) return;

    const settings = getSettings();
    const resolution = resolveCommand(textToRun, settings.searchProvider);

    if (resolution.success) {
      // 1. Internal Tab navigation
      if (resolution.type === 'internal' && resolution.internalTab) {
        setStatusFeedback({
          type: 'success',
          message: resolution.message,
          targetName: resolution.targetName,
        });

        addCommandHistory(textToRun, resolution.targetName || 'Tab', undefined, 'internal');

        if (onNavigateTab) {
          onNavigateTab(resolution.internalTab);
        }

        setTimeout(() => {
          setStatusFeedback({ type: null, message: '' });
        }, 2200);

        setQuery('');
        setIsFocused(false);
        return;
      }

      // 2. Web navigation (website, direct URL, or search)
      if (resolution.url) {
        setStatusFeedback({
          type: 'success',
          message: resolution.message,
          targetName: resolution.targetName,
          url: resolution.url,
        });

        // Add to history
        addCommandHistory(
          textToRun,
          resolution.targetName || 'Website',
          resolution.url,
          resolution.type
        );

        if (onExecuteSuccess) {
          onExecuteSuccess(resolution);
        }

        // Safe open
        safeOpenUrl(resolution.url, settings.openInNewTab);

        setTimeout(() => {
          setStatusFeedback({ type: null, message: '' });
        }, 3000);

        setQuery('');
        setIsFocused(false);
      }
    } else {
      // Unknown command feedback
      setStatusFeedback({
        type: 'unknown',
        message: resolution.message,
        suggestions: resolution.suggestions || [
          'open YouTube',
          'open GitHub',
          'open WhatsApp',
        ],
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative select-none">
      {/* Primary Input Container */}
      <div
        className={`group relative rounded-3xl border transition-all duration-200 backdrop-blur-xl ${
          isDark
            ? isFocused
              ? 'bg-[#0d1322] border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.18)] ring-2 ring-emerald-500/20'
              : 'bg-[#0d1322]/90 border-slate-800 hover:border-slate-700 shadow-xl'
            : isFocused
              ? 'bg-white border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-md'
        }`}
      >
        <div className="flex items-center px-4 py-3 sm:py-3.5 gap-3">
          {/* Left Icon with subtle glowing status */}
          <div className="flex items-center justify-center shrink-0">
            <div
              className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${
                isFocused
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner'
                  : isDark
                    ? 'bg-slate-800/80 text-slate-400 border border-slate-700'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105" />
            </div>
          </div>

          {/* Main Input Element */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              autoFocus={autoFocus}
              placeholder={`Type a command... (e.g. ${PLACEHOLDER_ROTATIONS[placeholderIndex]})`}
              className={`w-full bg-transparent focus:outline-none text-sm sm:text-base font-sans font-medium tracking-tight ${
                isDark
                  ? 'text-slate-100 placeholder:text-slate-500'
                  : 'text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Clear button if text entered */}
          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className={`p-1 rounded-lg transition cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Keyboard shortcut hint */}
            <div
              className={`hidden sm:inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-mono border shadow-xs ${
                isDark
                  ? 'bg-slate-800/90 text-slate-400 border-slate-700/80'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span>{isMac ? '⌘K' : 'Ctrl+K'}</span>
            </div>

            {/* Execute Button */}
            <button
              type="button"
              onClick={() => handleExecute()}
              disabled={!query.trim()}
              className="flex items-center justify-center h-9 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer active:scale-95"
            >
              <span className="hidden sm:inline mr-1.5">Open</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Command Execution Feedback Status */}
      {statusFeedback.type === 'success' && (
        <div className="mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">{statusFeedback.message}</span>
          </div>
          {statusFeedback.url && (
            <a
              href={statusFeedback.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
            >
              <span>{statusFeedback.targetName}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Unknown Command Feedback State */}
      {statusFeedback.type === 'unknown' && (
        <div className="mt-3 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-rose-300 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{statusFeedback.message}</span>
          </div>

          <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-1.5 pt-1">
            <span>Try:</span>
            {statusFeedback.suggestions?.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(sug);
                  handleExecute(sug);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] border border-slate-700 transition cursor-pointer"
              >
                "{sug}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
