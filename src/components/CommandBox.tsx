import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Paperclip,
  ArrowRight,
  Sparkles,
  X,
  FileText,
  Search,
  Zap,
} from 'lucide-react';
import { CommandIntentResult } from '@/shared/types/ninja';
import { SAMPLE_COMMANDS, TOOLS } from '@/shared/constants/tools';

interface Props {
  onExecuteCommand: (command: string, file: File | null) => Promise<void>;
  onOpenBrowseTools: () => void;
  isProcessing: boolean;
  detectedIntent?: CommandIntentResult | null;
}

const PLACEHOLDERS = [
  'Compress a PDF...',
  'Create a QR code for my Instagram...',
  'Calculate EMI for 500000 at 9 percent for 5 years...',
  'Open WhatsApp...',
  'Summarize this file...',
  'Resize this image to 1080x1080...',
  'Convert 10 USD to INR...',
  'Generate a strong password...',
  'Translate this text to Kannada...',
  'Generate an executive resume...',
];

export const CommandBox: React.FC<Props> = ({
  onExecuteCommand,
  onOpenBrowseTools,
  isProcessing,
  detectedIntent,
}) => {
  const [query, setQuery] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder text every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !attachedFile) return;
    onExecuteCommand(query.trim() || 'Process attached file', attachedFile);
  };

  const handleSuggestionClick = (cmd: string) => {
    setQuery(cmd);
    inputRef.current?.focus();
    onExecuteCommand(cmd, attachedFile);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Main Command Input Card */}
      <form
        onSubmit={handleSubmit}
        className={`relative rounded-2xl border transition-all duration-200 bg-[#0d1322]/90 backdrop-blur-xl shadow-2xl ${
          isFocused
            ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-emerald-500/5'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Top Attached File Pill if any */}
        {attachedFile && (
          <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-semibold truncate max-w-xs">{attachedFile.name}</span>
              <span className="text-slate-500">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-center px-4 py-3 sm:py-4 gap-3">
          <div className="flex items-center justify-center text-slate-400 pl-1">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            disabled={isProcessing}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base sm:text-lg font-sans tracking-tight"
          />

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                attachedFile
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Attach File (PDF, Image, Doc)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isProcessing || (!query.trim() && !attachedFile)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs sm:text-sm hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Routing...</span>
                </>
              ) : (
                <>
                  <span>Run</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom micro-bar: Detected Intent & Shortcut helper */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800/40 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            {detectedIntent ? (
              <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
                <Sparkles className="w-3 h-3" />
                Routing to {TOOLS.find((t) => t.id === detectedIntent.toolId)?.name || detectedIntent.toolId}
              </span>
            ) : (
              <span className="text-slate-500 font-mono">Natural Language + AI Intent Router</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono border border-slate-700">
              Ctrl+K
            </kbd>
            <button
              type="button"
              onClick={onOpenBrowseTools}
              className="text-slate-400 hover:text-emerald-400 transition cursor-pointer"
            >
              Browse Tools →
            </button>
          </div>
        </div>
      </form>

      {/* "Try saying" suggestions */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Try saying:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            'Compress my PDF',
            'Create a QR code',
            'Summarize this document',
            'Calculate EMI for 500000 at 9 percent for 5 years',
            'Convert image to JPG',
            'Resize this image to 1080x1080',
            'Open WhatsApp',
            'Convert 10 USD to INR',
            'Generate a strong password',
          ].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => handleSuggestionClick(cmd)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer text-left"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
