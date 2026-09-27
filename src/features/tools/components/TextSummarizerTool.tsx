import React, { useState } from 'react';
import { Sparkles, Copy, Check, Download, RefreshCw, UploadCloud, FileText, AlertCircle } from 'lucide-react';

interface Props {
  initialFile?: File | null;
  initialText?: string;
  onRecordHistory?: (result: any) => void;
}

export const TextSummarizerTool: React.FC<Props> = ({ initialFile, initialText, onRecordHistory }) => {
  const [text, setText] = useState(initialText || '');
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [format, setFormat] = useState<'bullets' | 'executive' | 'concise'>('bullets');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (initialText) setText(initialText);
    if (initialFile) {
      setFile(initialFile);
      setText(`[File attached: ${initialFile.name} (${(initialFile.size / 1024).toFixed(1)} KB)]\n\nPlease extract executive summary and key findings from this document.`);
    }
  }, [initialFile, initialText]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);

      // If it's a text file, read directly
      if (selected.type.includes('text') || selected.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            setText(evt.target.result as string);
          }
        };
        reader.readAsText(selected);
      } else {
        // For PDF or other documents, provide clear file attachment indication
        setText(`[File attached: ${selected.name} (${(selected.size / 1024).toFixed(1)} KB)]\n\nPlease extract executive summary and key findings from this document.`);
      }
    }
  };

  const handleSummarize = async () => {
    if (!text.trim() && !file) {
      setError('Please provide text or upload a document to summarize.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          format,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to summarize document.');
      }

      setSummary(data.summary);

      if (onRecordHistory) {
        onRecordHistory({
          command: `Summarized ${file ? file.name : text.substring(0, 30)}...`,
          toolId: 'text-summarizer',
          toolName: 'AI Text Summarizer',
          status: 'success',
          resultPreview: data.summary.substring(0, 100) + '...',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI engine.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ninja_summary_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Input section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Format:</span>
            {(['bullets', 'executive', 'concise'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`text-xs px-3 py-1 rounded-lg border capitalize transition cursor-pointer ${
                  format === fmt
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 cursor-pointer transition">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{file ? file.name : 'Upload PDF / TXT'}</span>
            <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste articles, research papers, meeting notes, or upload a document to summarize..."
          className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 placeholder-slate-500 font-sans text-sm focus:outline-none focus:border-emerald-500 leading-relaxed"
        />

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {text.length > 0 ? `${text.trim().split(/\s+/).length} words (${text.length} chars)` : 'Empty document'}
          </span>
          <button
            onClick={handleSummarize}
            disabled={isProcessing || !text.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Summarizing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Summarize Document</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Result */}
      {summary && (
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0d1322] p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-sm font-semibold text-white">Gemini Executive Summary</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .MD</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-emerald-500 selection:text-black">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
};
