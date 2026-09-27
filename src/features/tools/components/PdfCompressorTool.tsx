import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Download, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  initialFile?: File | null;
  onRecordHistory?: (result: any) => void;
}

export const PdfCompressorTool: React.FC<Props> = ({ initialFile, onRecordHistory }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'compress' | 'split'>('compress');
  const [pageRange, setPageRange] = useState('1');
  const [result, setResult] = useState<{
    originalSize: number;
    newSize: number;
    reductionPercentage: number;
    downloadUrl: string;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      setResult(null);
      setError(null);
    }
  }, [initialFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
        setError('Please select a valid PDF file.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
        setError('Please drop a valid PDF file.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCompress = async () => {
    if (!file) {
      setError('Please upload a PDF file to compress.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/files/compress-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compress PDF.');
      }

      setResult(data);
      if (onRecordHistory) {
        onRecordHistory({
          command: `Compressed ${file.name}`,
          toolId: 'pdf-compressor',
          toolName: 'PDF Compressor',
          status: 'success',
          resultPreview: `Reduced by ${data.reductionPercentage}% (${formatSize(data.originalSize)} → ${formatSize(data.newSize)})`,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Compression failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
            }`}
            onClick={() => document.getElementById('pdf-input')?.click()}
          >
            <input
              id="pdf-input"
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {file ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-white">{file.name}</div>
                <div className="text-xs text-slate-400">{formatSize(file.size)}</div>
                <span className="text-xs text-emerald-400 font-medium">Click or drop to replace file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  Drop your PDF here, or <span className="text-emerald-400 underline">browse</span>
                </div>
                <div className="text-xs text-slate-500">Supports standard PDF documents up to 50MB</div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">
              Compression engine: <span className="font-mono text-slate-300">Object Stream Flattener</span>
            </div>
            <button
              onClick={handleCompress}
              disabled={!file || isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compressing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Compress PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Result Card */
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0d1322] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">PDF compressed successfully</h4>
                <p className="text-xs text-slate-400">{file?.name}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              -{result.reductionPercentage}% Smaller
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">Original Size</div>
              <div className="text-base font-mono font-bold text-slate-200 mt-1">{formatSize(result.originalSize)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">New Size</div>
              <div className="text-base font-mono font-bold text-emerald-400 mt-1">{formatSize(result.newSize)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Saved</div>
              <div className="text-base font-mono font-bold text-sky-400 mt-1">{formatSize(result.originalSize - result.newSize)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <a
              href={result.downloadUrl}
              download={result.filename}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Compressed PDF</span>
            </a>
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-700 transition cursor-pointer"
            >
              Compress Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
