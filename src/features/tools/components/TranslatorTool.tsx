import React, { useState, useEffect } from 'react';
import { Languages, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  initialText?: string;
  initialParameters?: { targetLanguage?: string };
  onRecordHistory?: (result: any) => void;
}

const LANGUAGES = [
  'Kannada',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Telugu',
  'Tamil',
  'Chinese (Mandarin)',
  'Arabic',
  'Russian',
  'Portuguese',
  'Italian',
];

export const TranslatorTool: React.FC<Props> = ({ initialText, initialParameters, onRecordHistory }) => {
  const [text, setText] = useState(initialText || '');
  const [targetLanguage, setTargetLanguage] = useState(initialParameters?.targetLanguage || 'Kannada');
  const [translation, setTranslation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialParameters?.targetLanguage) {
      setTargetLanguage(initialParameters.targetLanguage);
    }
  }, [initialParameters]);

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError('Please provide text to translate.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          targetLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Translation failed.');
      }

      setTranslation(data.translation);

      if (onRecordHistory) {
        onRecordHistory({
          command: `Translated "${text.substring(0, 25)}..." to ${targetLanguage}`,
          toolId: 'translator',
          toolName: 'AI Polyglot Translator',
          status: 'success',
          resultPreview: data.translation.substring(0, 80) + '...',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error executing translation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!translation) return;
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Language:</span>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-xs font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleTranslate}
          disabled={isProcessing || !text.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-xs bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <Languages className="w-3.5 h-3.5" />
              <span>Translate Now</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Text */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium">Source Text</label>
          <textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste sentences in English or any language..."
            className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>

        {/* Translation Output */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs text-slate-400 font-medium">{targetLanguage} Output</label>
            {translation && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
          <div className="w-full min-h-[178px] p-4 rounded-xl border border-slate-800 bg-[#0d1322] text-slate-100 text-sm leading-relaxed overflow-y-auto font-sans">
            {translation ? (
              <div className="whitespace-pre-wrap">{translation}</div>
            ) : (
              <span className="text-slate-500 text-xs italic">
                Translation will appear here after clicking 'Translate Now'.
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
