import React from 'react';
import { Terminal, Shield, Zap, Heart } from 'lucide-react';

export const Footer: React.FC<{
  onSelectTab: (tab: string) => void;
  effectiveTheme?: 'dark' | 'light';
}> = ({ onSelectTab, effectiveTheme = 'dark' }) => {
  const isDark = effectiveTheme === 'dark';

  return (
    <footer
      className={`border-t text-xs py-10 mt-20 transition-colors duration-200 ${
        isDark
          ? 'border-slate-800/80 bg-[#070a12] text-slate-400'
          : 'border-slate-200 bg-slate-100 text-slate-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="space-y-1">
            <div
              className={`flex items-center gap-2 font-mono font-bold text-sm tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <span>NINJA</span>
              <span className="text-[10px] text-emerald-500 font-mono">PERSONAL WEB COMMAND CENTER</span>
            </div>
            <p className={isDark ? 'text-slate-500 text-xs' : 'text-slate-600 text-xs'}>
              One command. Infinite possibilities. Your web, simplified.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => onSelectTab('tools')}
              className="hover:text-emerald-500 transition cursor-pointer"
            >
              Tools Ecosystem
            </button>
            <button
              onClick={() => onSelectTab('workflows')}
              className="hover:text-emerald-500 transition cursor-pointer"
            >
              Workflows
            </button>
            <button
              onClick={() => onSelectTab('workspace')}
              className="hover:text-emerald-500 transition cursor-pointer"
            >
              Private Workspace
            </button>
            <button
              onClick={() => onSelectTab('about')}
              className="hover:text-emerald-500 transition cursor-pointer"
            >
              System Specs
            </button>
          </div>
        </div>

        <div
          className={`flex flex-col sm:flex-row items-center justify-between text-[11px] gap-4 ${
            isDark ? 'text-slate-500' : 'text-slate-600'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Engine: Online (Gemini 3.8 Flash + Native Core)
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-slate-400" />
              Isolated Client Sandboxing
            </span>
          </div>

          <div>Built with extreme precision for modern web operators.</div>
        </div>
      </div>
    </footer>
  );
};
