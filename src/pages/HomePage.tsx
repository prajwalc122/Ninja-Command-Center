import React, { useState } from 'react';
import { CommandBox } from '../components/CommandBox';
import { ToolExecutor } from '../features/tools/ToolExecutor';
import { CommandIntentResult, ToolDefinition } from '@/shared/types/ninja';
import { TOOLS } from '@/shared/constants/tools';
import {
  FileArchive,
  QrCode,
  Calculator,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';

interface Props {
  initialCommand?: string | null;
  onSelectTool: (toolId: string, params?: Record<string, any>, file?: File | null) => void;
  onNavigateTab: (tab: string) => void;
  onRecordHistory: (record: any) => void;
}

export const HomePage: React.FC<Props> = ({
  initialCommand,
  onSelectTool,
  onNavigateTab,
  onRecordHistory,
}) => {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [activeParameters, setActiveParameters] = useState<Record<string, any>>({});
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<CommandIntentResult | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);
  const toolSectionRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll when tool is activated
  React.useEffect(() => {
    if (activeToolId && toolSectionRef.current) {
      setTimeout(() => {
        toolSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [activeToolId]);

  // Execute initial command if passed from History rerun
  React.useEffect(() => {
    if (initialCommand) {
      handleExecuteCommand(initialCommand, null);
    }
  }, [initialCommand]);

  const handleExecuteCommand = async (command: string, file: File | null) => {
    setIsProcessing(true);
    setAttachedFile(file);
    setExecutionMessage(null);

    try {
      const fileInfo = file ? { filename: file.name, mimeType: file.type } : undefined;

      const res = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, fileInfo }),
      });

      let targetToolId: string | null = null;
      let targetParams: Record<string, any> = {};
      let targetExplanation = '';

      if (res.ok) {
        const data: CommandIntentResult = await res.json();
        if (data.toolId) {
          targetToolId = data.toolId;
          targetParams = data.parameters || {};
          targetExplanation = data.explanation || `Mapped to ${data.toolId}`;
          setDetectedIntent(data);
        }
      }

      // If backend was unreachable or didn't return a toolId, use instant client-side fallback
      if (!targetToolId) {
        const q = command.toLowerCase();
        let matched = TOOLS[0];
        let maxScore = -1;

        for (const t of TOOLS) {
          let score = 0;
          if (q.includes(t.id)) score += 10;
          if (q.includes(t.name.toLowerCase())) score += 8;
          for (const kw of t.keywords) {
            if (q.includes(kw.toLowerCase())) score += 4;
          }
          if (score > maxScore) {
            maxScore = score;
            matched = t;
          }
        }

        targetToolId = matched.id;
        targetExplanation = `Activated ${matched.name}`;
      }

      setActiveToolId(targetToolId);
      setActiveParameters(targetParams);
      setExecutionMessage(targetExplanation);

      // Record to history
      onRecordHistory({
        command,
        toolId: targetToolId,
        toolName: TOOLS.find((t) => t.id === targetToolId)?.name || targetToolId,
        status: 'success',
        resultPreview: targetExplanation,
        parameters: targetParams,
      });
    } catch (err) {
      console.warn('Network command execution warning, falling back to local resolver:', err);
      // Emergency offline fallback
      setActiveToolId('qr-generator');
    } finally {
      setIsProcessing(false);
    }
  };

  const popularTools = TOOLS.filter((t) => t.isPopular).slice(0, 6);

  return (
    <div className="space-y-16 py-6 sm:py-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-800 bg-[#0d1322] text-xs font-mono text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>NINJA Command Engine v1.0 Online</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Tell <span className="text-emerald-400 font-mono">NINJA</span> what you need.
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
          One intelligent command center for the tools, files, calculations, and workflows you use every day.
        </p>

        {/* Central Command Box */}
        <div className="pt-4">
          <CommandBox
            onExecuteCommand={handleExecuteCommand}
            onOpenBrowseTools={() => onNavigateTab('tools')}
            isProcessing={isProcessing}
            detectedIntent={detectedIntent}
          />
        </div>
      </section>

      {/* Active Tool Execution Workspace */}
      {activeToolId && (
        <section ref={toolSectionRef} className="max-w-4xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-300 scroll-mt-6">
          {executionMessage && (
            <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{executionMessage}</span>
              </span>
              <span className="text-[10px] text-slate-400">Ready for input</span>
            </div>
          )}
          <ToolExecutor
            toolId={activeToolId}
            parameters={activeParameters}
            attachedFile={attachedFile}
            onBack={() => {
              setActiveToolId(null);
              setDetectedIntent(null);
              setExecutionMessage(null);
            }}
            onRecordHistory={onRecordHistory}
          />
        </section>
      )}

      {/* Featured Utilities Quick Launch */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Popular Utilities</h3>
            <p className="text-xs text-slate-400">Direct shortcuts to high-frequency tools</p>
          </div>
          <button
            onClick={() => onNavigateTab('tools')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition"
          >
            <span>View all 30+ tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => {
                setActiveToolId(tool.id);
                setActiveParameters({});
              }}
              className="group p-5 rounded-2xl border border-slate-800 bg-[#0d1322]/80 hover:border-slate-700 hover:bg-[#11192e] transition cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    {tool.category === 'file' && <FileArchive className="w-4 h-4" />}
                    {tool.category === 'generators' && <QrCode className="w-4 h-4" />}
                    {tool.category === 'calculators' && <Calculator className="w-4 h-4" />}
                    {tool.category === 'ai' && <Sparkles className="w-4 h-4" />}
                    {tool.category === 'web' && <ExternalLink className="w-4 h-4" />}
                    {!['file', 'generators', 'calculators', 'ai', 'web'].includes(tool.category) && (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {tool.category}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                  {tool.name}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {tool.shortDescription}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400 group-hover:text-slate-200">
                <span className="font-mono text-[11px]">Instant execution</span>
                <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Open Tool →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflows Preview Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0d1322] via-[#0f172a] to-[#0d1322] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Tool Automation</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Chain actions together with NINJA Workflows
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
              Example: "Prepare image for Instagram" automatically resizes to 1080x1080, compresses, and converts to optimized JPG in a single flow.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('workflows')}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition cursor-pointer shrink-0 flex items-center gap-2"
          >
            <span>Explore Workflows</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
