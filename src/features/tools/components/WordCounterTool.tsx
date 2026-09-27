import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  onRecordHistory?: (result: any) => void;
}

export const WordCounterTool: React.FC<Props> = ({ onRecordHistory }) => {
  const [text, setText] = useState('NINJA is a modern Personal Web Command Center where users can type what they want to accomplish.');
  const [copied, setCopied] = useState(false);

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const charsWithSpaces = text.length;
  const charsNoSpaces = text.replace(/\s+/g, '').length;
  const sentences = trimmed ? (trimmed.match(/[.!?]+(?:\s|$)/g) || []).length || 1 : 0;
  const paragraphs = trimmed ? trimmed.split(/\n+/).filter(Boolean).length : 0;
  const readingTimeMin = (words / 200).toFixed(1);
  const speakingTimeMin = (words / 130).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="text-xs text-slate-400">Words</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{words}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="text-xs text-slate-400">Characters</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{charsWithSpaces}</div>
          <div className="text-[10px] text-slate-500">{charsNoSpaces} without spaces</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="text-xs text-slate-400">Reading Time</div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">~{readingTimeMin} m</div>
          <div className="text-[10px] text-slate-500">at 200 wpm</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          <div className="text-xs text-slate-400">Sentences / Paras</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{sentences} / {paragraphs}</div>
        </div>
      </div>

      <textarea
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste text to analyze..."
        className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
      />
    </div>
  );
};
