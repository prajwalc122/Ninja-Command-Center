import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, QrCode } from 'lucide-react';
import { generateQRSvg } from '@/src/utils/qrCodeGenerator';

interface Props {
  initialContent?: string;
  onRecordHistory?: (result: any) => void;
}

export const QrGeneratorTool: React.FC<Props> = ({ initialContent, onRecordHistory }) => {
  const [content, setContent] = useState(initialContent || 'https://instagram.com/my_ninja_profile');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const svgString = generateQRSvg(content.trim() || 'NINJA', fgColor, bgColor);

  const handleDownloadSvg = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ninja_qr_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);

    if (onRecordHistory) {
      onRecordHistory({
        command: `Created QR code for "${content.substring(0, 30)}"`,
        toolId: 'qr-generator',
        toolName: 'QR Code Generator',
        status: 'success',
        resultPreview: 'Downloaded vector SVG QR code',
      });
    }
  };

  const handleDownloadPng = () => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 1000, 1000);
        ctx.drawImage(img, 0, 0, 1000, 1000);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `ninja_qr_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;

    if (onRecordHistory) {
      onRecordHistory({
        command: `Created QR code for "${content.substring(0, 30)}"`,
        toolId: 'qr-generator',
        toolName: 'QR Code Generator',
        status: 'success',
        resultPreview: 'Downloaded 1000x1000 PNG QR code',
      });
    }
  };

  const handleCopySvg = () => {
    navigator.clipboard.writeText(svgString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Controls */}
      <div className="md:col-span-7 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target URL or Content
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://example.com, Instagram link, or text..."
            className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-sm transition"
          />
        </div>

        {/* Quick presets */}
        <div>
          <span className="text-xs text-slate-400 mb-2 block">Quick Presets:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setContent('https://instagram.com/ninja')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Instagram
            </button>
            <button
              onClick={() => setContent('https://github.com/developer')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              GitHub
            </button>
            <button
              onClick={() => setContent('WIFI:S:OfficeNetwork;T:WPA;P:SuperSecretPass;;')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              WiFi Connect
            </button>
            <button
              onClick={() => setContent('https://ninja.app')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              NINJA Home
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">QR Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-9 w-12 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-xs text-slate-300">{fgColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-12 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-xs text-slate-300">{bgColor}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleDownloadPng}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG (1000px)</span>
          </button>
          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>
          <button
            onClick={handleCopySvg}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition cursor-pointer"
            title="Copy SVG markup"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* QR Preview Display */}
      <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div
          className="p-4 rounded-2xl shadow-xl transition-all max-w-[240px] w-full aspect-square flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
        <div className="mt-4 text-center">
          <div className="text-xs font-mono text-slate-400 truncate max-w-[220px]">
            {content || 'Enter text to generate'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">High-contrast, permanent vector QR</div>
        </div>
      </div>
    </div>
  );
};
