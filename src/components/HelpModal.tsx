import React from 'react';
import { X, Terminal, ArrowRight, Command, Search, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryCommand: (cmd: string) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, onTryCommand }) => {
  if (!isOpen) return null;

  const examples = [
    { cmd: 'open youtube', desc: 'Direct website command' },
    { cmd: 'open whatsapp', desc: 'Opens WhatsApp Web instantly' },
    { cmd: 'github', desc: 'Direct name without "open"' },
    { cmd: 'yt', desc: 'Speed alias for YouTube' },
    { cmd: 'wa', desc: 'Speed alias for WhatsApp' },
    { cmd: 'gh', desc: 'Speed alias for GitHub' },
    { cmd: 'gmail', desc: 'Opens Google Mail inbox' },
    { cmd: 'search python pandas', desc: 'Searches the web via Google' },
    { cmd: 'open chatgpt', desc: 'Conversational AI' },
    { cmd: 'open spotify', desc: 'Music and podcasts' },
    { cmd: 'open netflix', desc: 'Video streaming' },
    { cmd: 'open tools', desc: 'Jump to NINJA Utility Tools' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0d1322] shadow-2xl p-6 space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">How NINJA Works</h3>
              <p className="text-xs text-slate-400">Personal Web Command Center Quick Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intro */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <strong className="text-white font-semibold">NINJA</strong> is your personal web launcher.
            Type what you want to open, and Ninja understands the command and launches the correct website immediately.
          </p>
        </div>

        {/* Shortcuts */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider block">
            Keyboard Shortcuts
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Focus Command Bar</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px] border border-slate-700">
                ⌘K / Ctrl+K
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Execute Command</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px] border border-slate-700">
                Enter ↵
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Navigate Suggestions</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px] border border-slate-700">
                ↑ / ↓
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Dismiss / Clear</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px] border border-slate-700">
                Escape
              </kbd>
            </div>
          </div>
        </div>

        {/* Example Commands */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider block">
            Try Any of These Commands
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {examples.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onTryCommand(item.cmd);
                  onClose();
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 hover:bg-emerald-500/10 border border-slate-800/80 hover:border-emerald-500/30 text-left transition cursor-pointer group"
              >
                <div>
                  <div className="font-mono text-xs text-emerald-400 group-hover:text-emerald-300">
                    {item.cmd}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
