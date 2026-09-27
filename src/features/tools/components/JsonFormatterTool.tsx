import React, { useState } from 'react';
import { Code, Copy, Check, AlertCircle } from 'lucide-react';

interface Props {
  onRecordHistory?: (result: any) => void;
}

export const JsonFormatterTool: React.FC<Props> = ({ onRecordHistory }) => {
  const [input, setInput] = useState('{"name":"NINJA","type":"command-center","version":1.0,"features":["pdf","qr","emi","workflows"]}');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatJson = (spaces: number) => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, spaces);
      setInput(formatted);
      setError(null);

      if (onRecordHistory) {
        onRecordHistory({
          command: 'Formatted JSON payload',
          toolId: 'json-formatter',
          toolName: 'JSON Formatter',
          status: 'success',
          resultPreview: `Formatted JSON (${spaces} space indent)`,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax.');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => formatJson(2)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
          >
            Beautify (2 Spaces)
          </button>
          <button
            onClick={() => formatJson(4)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
          >
            Beautify (4 Spaces)
          </button>
          <button
            onClick={minifyJson}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
          >
            Minify
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition cursor-pointer shadow-md"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>
      </div>

      <textarea
        rows={12}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
        }}
        placeholder="Paste JSON here..."
        className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
      />

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
