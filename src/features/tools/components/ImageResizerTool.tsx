import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Download, Lock, Unlock, Image as ImageIcon } from 'lucide-react';

interface Props {
  initialFile?: File | null;
  initialParameters?: { width?: number; height?: number };
  onRecordHistory?: (result: any) => void;
}

export const ImageResizerTool: React.FC<Props> = ({ initialFile, initialParameters, onRecordHistory }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [origWidth, setOrigWidth] = useState(1920);
  const [origHeight, setOrigHeight] = useState(1080);
  const [targetWidth, setTargetWidth] = useState(initialParameters?.width || 1080);
  const [targetHeight, setTargetHeight] = useState(initialParameters?.height || 1080);
  const [lockAspect, setLockAspect] = useState(false);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialParameters) {
      if (initialParameters.width) setTargetWidth(initialParameters.width);
      if (initialParameters.height) setTargetHeight(initialParameters.height);
    }
  }, [initialParameters]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);

      const img = new Image();
      img.onload = () => {
        setOrigWidth(img.naturalWidth);
        setOrigHeight(img.naturalHeight);
        if (!initialParameters?.width) {
          setTargetWidth(img.naturalWidth);
          setTargetHeight(img.naturalHeight);
        }
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleWidthChange = (w: number) => {
    setTargetWidth(w);
    if (lockAspect && origWidth > 0) {
      const ratio = origHeight / origWidth;
      setTargetHeight(Math.round(w * ratio));
    }
  };

  const handleHeightChange = (h: number) => {
    setTargetHeight(h);
    if (lockAspect && origHeight > 0) {
      const ratio = origWidth / origHeight;
      setTargetWidth(Math.round(h * ratio));
    }
  };

  const handleResize = () => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setResizedUrl(dataUrl);

        if (onRecordHistory) {
          onRecordHistory({
            command: `Resized image to ${targetWidth}x${targetHeight}`,
            toolId: 'image-resizer',
            toolName: 'Image Resizer',
            status: 'success',
            resultPreview: `Dimensions: ${origWidth}x${origHeight} → ${targetWidth}x${targetHeight}`,
          });
        }
      }
    };
    img.src = imageSrc;
  };

  return (
    <div className="space-y-6">
      {!imageSrc ? (
        <label className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl p-10 text-center flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 transition">
          <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
          <div className="text-sm font-semibold text-white">Upload image to resize</div>
          <div className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP</div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <span className="text-xs text-slate-400 mb-2 block">Quick Social Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setTargetWidth(1080);
                    setTargetHeight(1080);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  Instagram Square (1080×1080)
                </button>
                <button
                  onClick={() => {
                    setTargetWidth(1080);
                    setTargetHeight(1920);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  Story / Reel (1080×1920)
                </button>
                <button
                  onClick={() => {
                    setTargetWidth(1920);
                    setTargetHeight(1080);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  Full HD (1920×1080)
                </button>
                <button
                  onClick={() => {
                    setTargetWidth(1200);
                    setTargetHeight(630);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  Web Banner (1200×630)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                onClick={() => setLockAspect(!lockAspect)}
                className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
              >
                {lockAspect ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{lockAspect ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}</span>
              </button>
              <span>Original: {origWidth}×{origHeight}</span>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={handleResize}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                Apply Resize ({targetWidth}×{targetHeight})
              </button>
              <button
                onClick={() => {
                  setImageSrc(null);
                  setFile(null);
                  setResizedUrl(null);
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition cursor-pointer"
              >
                Change Image
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-[#0d1322] p-4 flex flex-col items-center">
            <div className="text-xs text-slate-400 mb-2 font-medium">
              {resizedUrl ? `Resized Preview (${targetWidth}×${targetHeight})` : 'Source Preview'}
            </div>
            <div className="max-h-[300px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/60 p-2 border border-slate-800">
              <img
                src={resizedUrl || imageSrc}
                alt="Preview"
                className="max-h-[260px] object-contain rounded"
              />
            </div>
            {resizedUrl && (
              <a
                href={resizedUrl}
                download={`resized_${targetWidth}x${targetHeight}.jpg`}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Resized Image</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
