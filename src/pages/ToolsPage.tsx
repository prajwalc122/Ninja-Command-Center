import React, { useState, useMemo } from 'react';
import { TOOLS, CATEGORIES } from '@/shared/constants/tools';
import { ToolDefinition } from '@/shared/types/ninja';
import { ToolExecutor } from '../features/tools/ToolExecutor';
import {
  Search,
  FileArchive,
  QrCode,
  Calculator,
  Sparkles,
  ExternalLink,
  Code,
  Type,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface Props {
  initialToolId?: string | null;
  initialParameters?: Record<string, any>;
  onRecordHistory: (record: any) => void;
}

export const ToolsPage: React.FC<Props> = ({ initialToolId, initialParameters, onRecordHistory }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);

  React.useEffect(() => {
    if (initialToolId) {
      const match = TOOLS.find((t) => t.id === initialToolId || t.slug === initialToolId);
      if (match) setActiveTool(match);
    }
  }, [initialToolId]);

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const getToolIcon = (cat: string) => {
    switch (cat) {
      case 'file':
        return <FileArchive className="w-4 h-4" />;
      case 'generators':
        return <QrCode className="w-4 h-4" />;
      case 'calculators':
        return <Calculator className="w-4 h-4" />;
      case 'ai':
        return <Sparkles className="w-4 h-4" />;
      case 'web':
        return <ExternalLink className="w-4 h-4" />;
      case 'developer':
        return <Code className="w-4 h-4" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* If a tool is active, display the interactive executor */}
      {activeTool ? (
        <div className="space-y-4">
          <ToolExecutor
            toolId={activeTool.id}
            parameters={initialParameters}
            onBack={() => setActiveTool(null)}
            onRecordHistory={onRecordHistory}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Utility Catalog</h1>
            <p className="text-sm text-slate-400">
              Browse the complete suite of file processors, AI engines, calculators, and developers tools.
            </p>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools by name or keyword..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-black font-semibold shadow-md'
                      : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setActiveTool(tool)}
                className="group p-5 rounded-2xl border border-slate-800 bg-[#0d1322] hover:border-slate-700 hover:bg-[#11192e] transition cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      {getToolIcon(tool.category)}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {tool.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tool.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/60 text-slate-400">
                  <span className="font-mono text-[11px]">Browser & Node</span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Open Tool →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">No tools found matching "{search}"</div>
              <p className="text-xs text-slate-500">Try searching for keywords like "pdf", "qr", "image", or "calculate".</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
