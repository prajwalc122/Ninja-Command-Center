import React from 'react';
import { TOOLS } from '@/shared/constants/tools';
import { PdfCompressorTool } from './components/PdfCompressorTool';
import { QrGeneratorTool } from './components/QrGeneratorTool';
import { EmiCalculatorTool } from './components/EmiCalculatorTool';
import { WebLauncherTool } from './components/WebLauncherTool';
import { TextSummarizerTool } from './components/TextSummarizerTool';
import { ImageResizerTool } from './components/ImageResizerTool';
import { ImageConverterTool } from './components/ImageConverterTool';
import { PasswordGeneratorTool } from './components/PasswordGeneratorTool';
import { UnitConverterTool } from './components/UnitConverterTool';
import { TranslatorTool } from './components/TranslatorTool';
import { ResumeGeneratorTool } from './components/ResumeGeneratorTool';
import { JsonFormatterTool } from './components/JsonFormatterTool';
import { WordCounterTool } from './components/WordCounterTool';
import { ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';

interface Props {
  toolId: string;
  parameters?: Record<string, any>;
  attachedFile?: File | null;
  onBack?: () => void;
  onRecordHistory?: (record: any) => void;
}

export const ToolExecutor: React.FC<Props> = ({
  toolId,
  parameters,
  attachedFile,
  onBack,
  onRecordHistory,
}) => {
  const tool = TOOLS.find((t) => t.id === toolId) || TOOLS[0];

  const renderComponent = () => {
    switch (toolId) {
      case 'pdf-compressor':
        return <PdfCompressorTool initialFile={attachedFile} onRecordHistory={onRecordHistory} />;
      case 'qr-generator':
        return <QrGeneratorTool initialContent={parameters?.content} onRecordHistory={onRecordHistory} />;
      case 'emi-calculator':
        return <EmiCalculatorTool initialParameters={parameters} onRecordHistory={onRecordHistory} />;
      case 'open-whatsapp':
      case 'open-instagram':
      case 'open-youtube':
      case 'open-linkedin':
      case 'open-github':
      case 'open-gmail':
      case 'open-maps':
        return <WebLauncherTool toolId={toolId} parameters={parameters} onRecordHistory={onRecordHistory} />;
      case 'text-summarizer':
        return <TextSummarizerTool initialFile={attachedFile} initialText={parameters?.text} onRecordHistory={onRecordHistory} />;
      case 'image-resizer':
        return <ImageResizerTool initialFile={attachedFile} initialParameters={parameters} onRecordHistory={onRecordHistory} />;
      case 'image-converter':
      case 'image-compressor':
        return <ImageConverterTool initialFile={attachedFile} initialParameters={parameters} onRecordHistory={onRecordHistory} />;
      case 'password-generator':
        return <PasswordGeneratorTool initialParameters={parameters} onRecordHistory={onRecordHistory} />;
      case 'unit-converter':
      case 'basic-calculator':
      case 'percentage-calculator':
      case 'gst-calculator':
      case 'age-calculator':
        return <UnitConverterTool initialParameters={parameters} onRecordHistory={onRecordHistory} />;
      case 'translator':
        return <TranslatorTool initialParameters={parameters} onRecordHistory={onRecordHistory} />;
      case 'resume-generator':
        return <ResumeGeneratorTool onRecordHistory={onRecordHistory} />;
      case 'json-formatter':
        return <JsonFormatterTool onRecordHistory={onRecordHistory} />;
      case 'word-counter':
      case 'case-converter':
      case 'text-cleaner':
        return <WordCounterTool onRecordHistory={onRecordHistory} />;
      default:
        return <TextSummarizerTool initialFile={attachedFile} onRecordHistory={onRecordHistory} />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-[#0a0f1d] shadow-2xl p-6 sm:p-8 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Return to command center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{tool.name}</h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {tool.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{tool.shortDescription}</p>
          </div>
        </div>

        {tool.webUrl && (
          <a
            href={tool.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            <span>Destination</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Tool Work Area */}
      <div className="pt-2">{renderComponent()}</div>
    </div>
  );
};
