import React, { useState, useEffect } from 'react';
import { UploadCloud, Download, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Props {
  initialFile?: File | null;
  initialParameters?: { targetFormat?: string };
  onRecordHistory?: (result: any) => void;
}

export const ImageConverterTool: React.FC<Props> = ({ initialFile, initialParameters, onRecordHistory }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [format, setFormat] = useState<string>(initialParameters?.targetFormat || 'jpg');
  const [quality, setQuality] = useState<number>(90);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (initialParameters?.targetFormat) {
      setFormat(initialParameters.targetFormat.toLowerCase());
    }
  }, [initialParameters]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setConvertedUrl(null);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleConvert = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (format === 'jpg' || format === 'jpeg') {
          // White background for JPG transparency fill
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality / 100);
        setConvertedUrl(dataUrl);

        if (onRecordHistory) {
          onRecordHistory({
            command: `Converted ${file?.name || 'image'} to ${format.toUpperCase()}`,
            toolId: 'image-converter',
            toolName: 'Image Converter',
            status: 'success',
            resultPreview: `Converted to ${format.toUpperCase()} (${img.naturalWidth}x${img.naturalHeight})`,
          });
        }
      }
      setIsProcessing(false);
    };
    img.src = imageSrc;
  };

  return (
    <div className="space-y-6">
      {!imageSrc ? (
        <label className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl p-10 text-center flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 transition">
          <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
          <div className="text-sm font-semibold text-white">Upload image to convert</div>
          <div className="text-xs text-slate-500 mt-1">Convert between JPG, PNG, and WEBP</div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Convert To Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['jpg', 'png', 'webp'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`py-2.5 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                      format === fmt
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {format !== 'png' && (
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-400 uppercase tracking-wider">Quality</span>
                  <span className="font-mono text-emerald-400">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {isProcessing ? 'Converting...' : `Convert to ${format.toUpperCase()}`}
              </button>
              <button
                onClick={() => {
                  setImageSrc(null);
                  setFile(null);
                  setConvertedUrl(null);
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-[#0d1322] p-4 flex flex-col items-center">
            <div className="text-xs text-slate-400 mb-2 font-medium">
              {convertedUrl ? `Converted Image (${format.toUpperCase()})` : 'Source Preview'}
            </div>
            <div className="max-h-[300px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/60 p-2 border border-slate-800">
              <img
                src={convertedUrl || imageSrc}
                alt="Preview"
                className="max-h-[260px] object-contain rounded"
              />
            </div>
            {convertedUrl && (
              <a
                href={convertedUrl}
                download={`converted_image.${format}`}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download {format.toUpperCase()} Image</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
