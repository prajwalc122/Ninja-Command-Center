import React, { useEffect } from 'react';
import { ExternalLink, CheckCircle, ArrowUpRight, Copy, Check } from 'lucide-react';

interface Props {
  toolId: string;
  parameters?: { destination?: string; url?: string };
  onRecordHistory?: (result: any) => void;
}

const DESTINATIONS: Record<string, { name: string; url: string; description: string; iconBg: string }> = {
  'open-whatsapp': {
    name: 'WhatsApp Web',
    url: 'https://web.whatsapp.com',
    description: 'Direct launch to official WhatsApp Web messaging platform.',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  'open-instagram': {
    name: 'Instagram',
    url: 'https://www.instagram.com',
    description: 'Direct launch to Instagram web client and direct messages.',
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  'open-youtube': {
    name: 'YouTube',
    url: 'https://www.youtube.com',
    description: 'Direct launch to YouTube video streaming platform.',
    iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  'open-linkedin': {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com',
    description: 'Direct launch to LinkedIn professional network and messaging.',
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  'open-github': {
    name: 'GitHub',
    url: 'https://github.com',
    description: 'Direct launch to GitHub repository dashboard and pull requests.',
    iconBg: 'bg-slate-700/30 text-white border-slate-700',
  },
  'open-gmail': {
    name: 'Google Mail',
    url: 'https://mail.google.com',
    description: 'Direct launch to your Google Mail inbox.',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  'open-maps': {
    name: 'Google Maps',
    url: 'https://maps.google.com',
    description: 'Direct launch to Google Maps navigation and satellite directions.',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
};

export const WebLauncherTool: React.FC<Props> = ({ toolId, parameters, onRecordHistory }) => {
  const dest = DESTINATIONS[toolId] || {
    name: parameters?.destination || 'Web Application',
    url: parameters?.url || 'https://google.com',
    description: 'Official web destination launcher.',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (onRecordHistory) {
      onRecordHistory({
        command: `Opened ${dest.name}`,
        toolId,
        toolName: dest.name,
        status: 'success',
        resultPreview: `Launched ${dest.url}`,
      });
    }
  }, [toolId, dest.name, dest.url]);

  const handleCopy = () => {
    navigator.clipboard.writeText(dest.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto rounded-2xl border border-slate-800 bg-[#0d1322] p-8 text-center space-y-6">
      <div className="mx-auto h-16 w-16 rounded-2xl border flex items-center justify-center text-xl shadow-lg transition-transform hover:scale-105">
        <ArrowUpRight className="w-8 h-8 text-emerald-400" />
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Official Destination Verified</span>
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">{dest.name}</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{dest.description}</p>
      </div>

      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 select-all truncate">
        {dest.url}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <a
          href={dest.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <span>Launch {dest.name}</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          onClick={handleCopy}
          className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied' : 'Copy URL'}</span>
        </button>
      </div>
    </div>
  );
};
