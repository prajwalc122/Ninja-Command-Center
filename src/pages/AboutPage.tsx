import React from 'react';
import { Terminal, Shield, Zap, Cpu, Server, Lock, Layers } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-[#0d1322] text-xs font-mono text-emerald-400">
          <span>Engine Architecture & Manifesto</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          NINJA — Personal Web Command Center
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Designed for developers, creators, and operators who demand speed, autonomy, and zero-friction execution.
        </p>
      </div>

      {/* Philosophy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0d1322] space-y-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">One Single Input</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Stop switching between thirty random utility websites riddled with popup ads. Type what you need, and NINJA routes to the correct native tool instantly.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0d1322] space-y-3">
          <div className="h-10 w-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Zero Tracking, Real Privacy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All PDF and client manipulation runs in sandboxed environments without advertising trackers or telemetry spyware.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-slate-800 bg-[#0d1322] space-y-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Hybrid Edge & Gemini AI</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Blends instantaneous local pattern heuristics for sub-millisecond calculation routing with server-side Gemini 3.8 Flash intelligence for deep comprehension.
          </p>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="rounded-3xl border border-slate-800 bg-[#0d1322] p-8 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <span>Technical Architecture Stack</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-500">Core Runtime</span>
            <div className="text-slate-200 font-semibold">Node.js + Express + Vite Full-Stack</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-500">AI Engine</span>
            <div className="text-slate-200 font-semibold">@google/genai (Gemini 3.8 Flash)</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-500">File Processing Engine</span>
            <div className="text-slate-200 font-semibold">pdf-lib + Native HTML5 Canvas Shaders</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-500">PWA Offline Layer</span>
            <div className="text-slate-200 font-semibold">Service Worker Precaching & Manifest v3</div>
          </div>
        </div>
      </div>
    </div>
  );
};
