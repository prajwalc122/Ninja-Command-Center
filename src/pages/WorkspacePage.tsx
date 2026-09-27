import React, { useState, useEffect } from 'react';
import { StoredFile } from '@/shared/types/ninja';
import {
  UploadCloud,
  FileText,
  Download,
  Trash2,
  Search,
  HardDrive,
  RefreshCw,
  Eye,
  FileCode,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [inspectedFile, setInspectedFile] = useState<any | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (e) {
      console.error('Failed to load workspace files:', e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.file) {
          setFiles((prev) => [data.file, ...prev]);
        }
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/files/${id}`, { method: 'DELETE' });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (inspectedFile?.id === id) setInspectedFile(null);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalUsedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxStorageBytes = 50 * 1024 * 1024; // 50 MB
  const storagePercentage = Math.min(100, Math.round((totalUsedBytes / maxStorageBytes) * 100));

  const filtered = files.filter((f) =>
    (f.originalName || f.filename).toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Storage Quota */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Private File Workspace</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Store documents, images, and processed artifacts securely for instant tool pipelines.
          </p>
        </div>

        {/* Realistic Storage Limit Indicator */}
        <div className="w-full md:w-64 p-3.5 rounded-2xl border border-slate-800 bg-[#0d1322] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Workspace Storage</span>
            </span>
            <span className="font-mono text-white text-xs">{formatSize(totalUsedBytes)} / 50 MB</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upload & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspace files..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>

        <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/10">
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Uploading to Storage...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Upload New File</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.json"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* File List Table */}
      <div className="rounded-3xl border border-slate-800 bg-[#0d1322] overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {filtered.map((file) => {
              const isPdf = file.mimeType?.includes('pdf') || file.filename.endsWith('.pdf');
              const isImg = file.mimeType?.includes('image') || file.filename.match(/\.(jpg|png|webp)$/i);

              return (
                <div
                  key={file.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400">
                      {isPdf ? (
                        <FileText className="w-5 h-5" />
                      ) : isImg ? (
                        <ImageIcon className="w-5 h-5" />
                      ) : (
                        <FileCode className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate max-w-sm sm:max-w-md">
                        {file.originalName || file.filename}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span>{formatSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.mimeType || 'binary/stream'}</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a
                      href={file.downloadUrl}
                      download={file.originalName || file.filename}
                      className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <UploadCloud className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">Your workspace is clean</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Upload PDF files, images, or documents to inspect, compress, and run multi-step pipelines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
